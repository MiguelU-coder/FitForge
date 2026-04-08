import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { STRIPE_CLIENT } from './stripe.constants';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  // Expose Stripe client for advanced operations
  readonly stripe: Stripe;

  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripeClient: Stripe,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.stripe = this.stripeClient;
  }

  // ─── Customer ──────────────────────────────────────────────

  /**
   * Creates a Stripe Customer linked to a platform user.
   * Returns the Stripe customer ID to store in your DB.
   */
  async createCustomer(params: {
    email: string;
    name: string;
    userId: string; // your internal user ID as metadata
    orgId?: string;
  }): Promise<string> {
    const customer = await this.stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: {
        userId: params.userId,
        orgId: params.orgId ?? '',
      },
    });
    this.logger.log(`Stripe customer created: ${customer.id} for user ${params.userId}`);
    return customer.id;
  }

  // ─── Plans sync ────────────────────────────────────────────

  /**
   * Syncs a plan from your DB to Stripe.
   * Creates a Product + recurring Price if they don't exist yet.
   * Returns the Stripe Price ID — store this on your Plan entity.
   */
  async syncPlan(params: {
    planId: string; // your DB plan ID
    name: string; // e.g. "Gold", "Enterprise"
    amount: number; // in dollars (will be converted to cents)
    interval: 'month' | 'year';
  }): Promise<string> {
    // Check if product already exists using metadata search
    const existingProducts = await this.stripe.products.search({
      query: `metadata['planId']:'${params.planId}'`,
    });

    let productId: string;

    if (existingProducts.data.length > 0) {
      productId = existingProducts.data[0].id;
    } else {
      const product = await this.stripe.products.create({
        name: params.name,
        metadata: { planId: params.planId },
      });
      productId = product.id;
    }

    // Check if price already exists for this product
    const existingPrices = await this.stripe.prices.list({
      product: productId,
      active: true,
    });

    if (existingPrices.data.length > 0) {
      return existingPrices.data[0].id; // reuse existing price
    }

    // Create new recurring price
    const price = await this.stripe.prices.create({
      product: productId,
      unit_amount: Math.round(params.amount * 100), // cents
      currency: 'usd',
      recurring: { interval: params.interval },
      metadata: { planId: params.planId },
    });

    this.logger.log(`Stripe price synced: ${price.id} for plan ${params.planId}`);
    return price.id;
  }

  // ─── Checkout Sessions ───────────────────────────────────────

  /**
   * Creates a recurring Checkout Session and returns a Short URL.
   */
  async createShortCheckoutLink(params: {
    stripeCustomerId: string;
    stripePriceId: string;
    userId: string;
    planId: string;
    organizationId?: string;
  }): Promise<string> {
    const appUrl = this.config.get<string>('APP_URL') ?? 'http://localhost:3000';
    const baseUrl = appUrl.replace(/\/$/, '');

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: params.stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: params.stripePriceId, quantity: 1 }],
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/payment/cancel`,
      metadata: {
        userId: params.userId,
        planId: params.planId,
        orgId: params.organizationId ?? '',
      },
      customer_update: { name: 'auto', address: 'auto' },
      subscription_data: { metadata: { userId: params.userId, planId: params.planId } },
      allow_promotion_codes: true,
    });

    // Generate Short Link
    const crypto = require('crypto');
    const shortId = crypto.randomBytes(8).toString('hex');
    await this.prisma.checkoutLink.create({
      data: {
        shortId,
        url: session.url!,
      },
    });

    return `${baseUrl}/c/${shortId}`;
  }

  /**
   * Creates a Stripe Checkout Session in subscription mode.
   * DEPRECATED: Use createShortCheckoutLink instead.
   */
  async createCheckoutSession(params: {
    stripeCustomerId: string;
    stripePriceId: string;
    userId: string;
    successUrl?: string;
    cancelUrl?: string;
  }): Promise<{ sessionId: string; checkoutUrl: string }> {
    const appUrl = this.config.get<string>('APP_URL') ?? 'http://localhost:3000';

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: params.stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: params.stripePriceId, quantity: 1 }],
      success_url:
        params.successUrl ?? `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: params.cancelUrl ?? `${appUrl}/payment/cancel`,
      metadata: { userId: params.userId },
      customer_update: { name: 'auto', address: 'auto' },
      subscription_data: { metadata: { userId: params.userId } },
      allow_promotion_codes: true,
    });

    return {
      sessionId: session.id,
      checkoutUrl: session.url!,
    };
  }

  // ─── Subscription status ───────────────────────────────────

  /**
   * Returns true if the user has an active Stripe subscription.
   */
  async hasActiveSubscription(stripeCustomerId: string): Promise<boolean> {
    const subscriptions = await this.stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 1,
    });
    return subscriptions.data.length > 0;
  }

  /**
   * Creates a Stripe Customer Portal Session for billing management.
   */
  async createPortalSession(stripeCustomerId: string, returnUrl?: string): Promise<string> {
    const appUrl = this.config.get<string>('APP_URL') ?? 'http://localhost:3000';
    const session = await this.stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl ?? `${appUrl}/organizations`,
    });
    return session.url;
  }

  /**
   * Returns the raw subscription object.
   */
  async getSubscription(stripeCustomerId: string): Promise<Stripe.Subscription | null> {
    const list = await this.stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'all',
      limit: 1,
      expand: ['data.items.data.price.product'],
    });
    return list.data[0] ?? null;
  }

  // ─── Webhook signature verification ───────────────────────

  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not defined in environment variables');
    }
    return this.stripe.webhooks.constructEvent(rawBody, signature, secret);
  }
}
