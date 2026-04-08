import {
  Controller,
  Post,
  Body,
  Headers,
  Res,
  HttpStatus,
  BadRequestException,
  UseGuards,
  Req,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Public } from '../../common/decorators/public.decorator';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../database/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';

// ✅ FIX: regex para validar UUIDs antes de tocar Prisma
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertUUID(value: string | undefined, field: string): void {
  if (!value || !UUID_REGEX.test(value)) {
    throw new Error(
      `Metadata inválido — "${field}" no es un UUID: "${value}". ` +
        `¿Se está enviando un Stripe Price ID en lugar del ID interno?`,
    );
  }
}

@Controller('stripe')
export class StripeController {
  private readonly logger = new Logger(StripeController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => OrganizationsService))
    private readonly organizationsService: OrganizationsService,
  ) {}

  @Public()
  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: Request,
    @Res() res: Response,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    try {
      const event = this.stripeService.constructWebhookEvent((request as any).rawBody, signature);

      this.logger.log(`Stripe Webhook received: ${event.type}`);

      switch (event.type) {
        case 'checkout.session.completed':
          await this.processSuccessfulCheckout(event.data.object as any);
          break;

        case 'customer.subscription.deleted':
          await this.processSubscriptionDeletion(event.data.object as any);
          break;

        case 'customer.updated':
          await this.processCustomerUpdated(event.data.object as any);
          break;
      }

      return res.status(HttpStatus.OK).send({ received: true });
    } catch (err: any) {
      this.logger.error(`Webhook Error: ${err.message}`);
      return res.status(HttpStatus.BAD_REQUEST).send(`Webhook Error: ${err.message}`);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async createCheckout(@Req() req: any, @Body() body: { planId: string; organizationId?: string }) {
    const userId = req.user.id;
    const { planId, organizationId } = body;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const plan = await this.prisma.billingPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.stripePriceId)
      throw new BadRequestException('Plan not valid or not synced to Stripe');

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      stripeCustomerId = await this.stripeService.createCustomer({
        email: user.email,
        name: user.displayName,
        userId: user.id,
        orgId: organizationId,
      });
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    const shortUrl = await this.stripeService.createShortCheckoutLink({
      stripeCustomerId,
      stripePriceId: plan.stripePriceId,
      userId,
      planId, // ← UUID interno, NO el stripePriceId
      organizationId,
    });

    return { checkoutUrl: shortUrl };
  }

  private async processSuccessfulCheckout(session: any) {
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    this.logger.log(`Processing checkout.session.completed for customer ${customerId}`);

    // Check if this is a pending organization flow (new registration)
    const pendingOrg = await this.organizationsService.findPendingByStripeCustomer(customerId);

    if (pendingOrg) {
      // New organization registration flow
      this.logger.log(`Found pending organization ${pendingOrg.id} for customer ${customerId}`);

      // Mark as paid first
      await this.organizationsService.markAsPaid(customerId);

      // Complete organization creation (create user, send email, etc.)
      const result = await this.organizationsService.completeOrganizationAfterPayment(
        pendingOrg.id,
      );

      // Send payment confirmation email
      if (result.userId) {
        const user = await this.prisma.user.findUnique({ where: { id: result.userId } });
        if (user) {
          const org = await this.prisma.organization.findUnique({
            where: { id: result.organizationId },
          });
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
          const paymentLink = `${frontendUrl}/billing`;

          await this.organizationsService.sendPaymentConfirmation({
            email: user.email,
            displayName: user.displayName,
            amount: Number((pendingOrg as any).plan?.price || 29.99),
            currency: 'USD',
            organizationName: pendingOrg.name,
            paymentId: result.organizationId,
          });
        }
      }

      return;
    }

    // Legacy flow: existing user upgrading subscription
    const meta = session.metadata ?? {};
    const { userId, planId, orgId } = meta;

    // Validate UUIDs
    if (userId && userId !== 'pending') {
      assertUUID(userId, 'userId');
    }
    if (planId) {
      assertUUID(planId, 'planId');
    }
    if (orgId && orgId !== 'pending') {
      assertUUID(orgId, 'orgId');
    }

    // Only process if userId is a valid UUID (not 'pending')
    if (userId && userId !== 'pending') {
      this.logger.log(`Activating Plan ${planId} for User ${userId}`);

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          stripeSubscriptionId: subscriptionId,
          subscriptionStatus: 'active',
          stripePriceId: session.line_items?.data?.[0]?.price?.id ?? null,
        },
      });

      if (orgId && orgId !== 'pending') {
        await this.prisma.organization.update({
          where: { id: orgId },
          data: {
            planId,
            isActive: true,
          },
        });
      }
    }
  }

  private async processSubscriptionDeletion(subscription: any) {
    const userId = subscription.metadata?.userId;
    if (!userId) {
      this.logger.warn('subscription.deleted sin userId en metadata');
      return;
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { subscriptionStatus: 'canceled' },
    });
  }

  private async processCustomerUpdated(customer: any) {
    const userId = customer.metadata?.userId;
    if (!userId) {
      this.logger.warn('customer.updated sin userId en metadata');
      return;
    }

    this.logger.log(`Updating customer data for user ${userId}`);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        stripeCustomerId: customer.id,
        displayName: customer.name ?? customer.displayName,
      },
    });
  }
}
