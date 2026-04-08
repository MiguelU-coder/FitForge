import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '@prisma/client';
import { StripeService } from '../stripe/stripe.service';
import { EmailService } from '../email/email.service';
import * as argon2 from 'argon2';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => StripeService))
    private readonly stripeService: StripeService,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Create a pending organization with admin user data.
   * The user will be created AFTER payment is completed.
   */
  async create(data: {
    name: string;
    slug: string;
    logoUrl?: string;
    planId: string;
    adminEmail: string;
    adminFirstName?: string;
    adminLastName?: string;
    adminPassword?: string;
  }) {
    // Check if organization slug already exists
    const existingOrg = await this.prisma.organization.findUnique({
      where: { slug: data.slug },
    });

    if (existingOrg) {
      throw new ConflictException('Organization with this slug already exists');
    }

    // Check if email is already used
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.adminEmail },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Check if there's already a pending organization with this email
    const existingPending = await this.prisma.pendingOrganization.findUnique({
      where: { adminEmail: data.adminEmail },
    });

    if (existingPending) {
      throw new ConflictException('A pending registration already exists for this email');
    }

    // Validate plan exists
    const plan = await this.prisma.billingPlan.findUnique({ where: { id: data.planId } });
    if (!plan) throw new NotFoundException(`Plan ${data.planId} not found`);

    // Generate password if not provided
    const generatedPassword = data.adminPassword || randomBytes(4).toString('hex') + 'f!g';

    // Sync plan to Stripe
    const stripePriceId = await this.stripeService.syncPlan({
      planId: plan.id,
      name: plan.name,
      amount: Number(plan.price),
      interval: (plan.interval as 'month' | 'year') || 'month',
    });

    // Create Stripe customer (without creating user in DB yet)
    const stripeCustomer = await this.stripeService.createCustomer({
      email: data.adminEmail,
      name: `${data.adminFirstName || ''} ${data.adminLastName || ''}`.trim() || data.adminEmail,
      userId: 'pending', // Placeholder, will be updated after payment
      orgId: 'pending', // Placeholder
    });

    // Create checkout session
    const checkoutUrl = await this.stripeService.createShortCheckoutLink({
      stripeCustomerId: stripeCustomer,
      stripePriceId,
      userId: 'pending', // Will be updated in webhook
      planId: plan.id,
      organizationId: 'pending', // Will be updated in webhook
    });

    // Extract session ID from checkout URL
    const sessionIdMatch = checkoutUrl.match(/\/c\/([a-f0-9]+)/);
    const shortId = sessionIdMatch ? sessionIdMatch[1] : null;

    // Create pending organization record
    const pendingOrg = await this.prisma.pendingOrganization.create({
      data: {
        name: data.name,
        slug: data.slug,
        logoUrl: data.logoUrl,
        planId: data.planId,
        adminEmail: data.adminEmail,
        adminFirstName: data.adminFirstName,
        adminLastName: data.adminLastName,
        adminPassword: generatedPassword,
        stripeCustomerId: stripeCustomer,
        stripeCheckoutSessionId: shortId,
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    this.logger.log(`Created pending organization for ${data.adminEmail} with checkout URL`);

    return {
      pendingOrganizationId: pendingOrg.id,
      checkoutUrl,
      // Don't return the password in production - only for development
      ...(this.config.get('NODE_ENV') === 'development' && { generatedPassword }),
    };
  }

  /**
   * Complete organization creation after successful payment.
   * Called by Stripe webhook when checkout.session.completed.
   */
  async completeOrganizationAfterPayment(pendingOrgId: string) {
    const pendingOrg = await this.prisma.pendingOrganization.findUnique({
      where: { id: pendingOrgId },
      include: { plan: true },
    });

    if (!pendingOrg) {
      throw new NotFoundException(`Pending organization ${pendingOrgId} not found`);
    }

    if (pendingOrg.status === 'completed') {
      this.logger.log(`Organization ${pendingOrgId} already completed`);
      return { organizationId: pendingOrg.organizationId };
    }

    if (pendingOrg.status !== 'paid') {
      throw new BadRequestException(`Pending organization ${pendingOrgId} is not in paid status`);
    }

    // Hash the password
    const passwordHash = await argon2.hash(pendingOrg.adminPassword!);

    let authUserId: string | undefined;

    // Create user in Supabase Auth if configured
    const supabaseUrl = this.config.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: pendingOrg.adminEmail,
        password: pendingOrg.adminPassword!,
        email_confirm: true,
        user_metadata: {
          display_name:
            `${pendingOrg.adminFirstName || ''} ${pendingOrg.adminLastName || ''}`.trim(),
        },
      });

      if (authError && authError.message !== 'User already registered') {
        this.logger.error(`Error creating Supabase user: ${authError.message}`);
      } else if (authData?.user) {
        authUserId = authData.user.id;
      }
    }

    // Create user in local DB
    const user = await this.prisma.user.create({
      data: {
        id: authUserId,
        email: pendingOrg.adminEmail,
        passwordHash,
        displayName: `${pendingOrg.adminFirstName || ''} ${pendingOrg.adminLastName || ''}`.trim(),
        stripePriceId: pendingOrg.plan.stripePriceId,
        stripeCustomerId: pendingOrg.stripeCustomerId,
        subscriptionStatus: 'active',
        isActive: true,
      },
    });

    // Create organization with user as admin
    const organization = await this.prisma.organization.create({
      data: {
        name: pendingOrg.name,
        slug: pendingOrg.slug,
        logoUrl: pendingOrg.logoUrl,
        planId: pendingOrg.planId,
        isActive: true,
        users: {
          create: {
            role: 'ORG_ADMIN',
            userId: user.id,
          },
        },
      },
      include: { users: { include: { user: true } } },
    });

    // Update user with correct organization reference in Stripe metadata
    await this.stripeService.stripe.customers.update(pendingOrg.stripeCustomerId!, {
      metadata: {
        userId: user.id,
        orgId: organization.id,
      },
    });

    // Mark pending organization as completed
    await this.prisma.pendingOrganization.update({
      where: { id: pendingOrgId },
      data: {
        status: 'completed',
        organizationId: organization.id,
        completedAt: new Date(),
      },
    });

    // Send welcome email with credentials
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    await this.emailService.sendWelcomeEmail({
      email: pendingOrg.adminEmail,
      password: pendingOrg.adminPassword!,
      organizationName: pendingOrg.name,
      loginUrl: `${frontendUrl}/login`,
    });

    this.logger.log(`Organization ${organization.id} created for user ${user.email}`);

    return {
      organizationId: organization.id,
      userId: user.id,
    };
  }

  /**
   * Mark a pending organization as paid (webhook will call this)
   */
  async markAsPaid(stripeCustomerId: string) {
    const pendingOrg = await this.prisma.pendingOrganization.findFirst({
      where: { stripeCustomerId },
    });

    if (!pendingOrg) {
      this.logger.warn(`No pending organization found for Stripe customer ${stripeCustomerId}`);
      return null;
    }

    const updated = await this.prisma.pendingOrganization.update({
      where: { id: pendingOrg.id },
      data: {
        status: 'paid',
        paidAt: new Date(),
      },
    });

    this.logger.log(`Pending organization ${pendingOrg.id} marked as paid`);

    return updated;
  }

  /**
   * Find pending organization by Stripe customer ID
   */
  async findPendingByStripeCustomer(stripeCustomerId: string) {
    return this.prisma.pendingOrganization.findFirst({
      where: { stripeCustomerId },
    });
  }

  async findAll() {
    return this.prisma.organization.findMany({
      include: {
        _count: {
          select: { users: true },
        },
        plan: true,
        users: {
          where: { role: UserRole.ORG_ADMIN },
          take: 1,
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: { name?: string; slug?: string; logoUrl?: string; planId?: string },
  ) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // Check if slug is taken by another org
    if (data.slug && data.slug !== org.slug) {
      const existing = await this.prisma.organization.findUnique({ where: { slug: data.slug } });
      if (existing) {
        throw new ConflictException('Slug already globally in use');
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.planId !== undefined) updateData.planId = data.planId;

    return this.prisma.organization.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: { users: true },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const userIds = org.users.map((u) => u.userId);

    const deletedOrg = await this.prisma.organization.delete({
      where: { id },
    });

    if (userIds.length > 0) {
      await this.prisma.user.deleteMany({
        where: {
          id: { in: userIds },
          isGlobalAdmin: false,
        },
      });
    }

    return deletedOrg;
  }

  async findOne(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  async addUser(organizationId: string, userId: string, role: UserRole = UserRole.CLIENT) {
    return this.prisma.userOrganization.upsert({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      update: { role },
      create: {
        userId,
        organizationId,
        role,
      },
    });
  }

  async removeUser(organizationId: string, userId: string) {
    return this.prisma.userOrganization.delete({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });
  }

  async createPortalSession(organizationId: string) {
    // 1. Try to find the established owner (ORG_ADMIN)
    let orgUser = await this.prisma.userOrganization.findFirst({
      where: { organizationId, role: UserRole.ORG_ADMIN },
      include: { user: true },
    });

    // 2. HEALING: If no explicit owner is found, pick the first user and promote them
    if (!orgUser) {
      this.logger.warn(
        `No ORG_ADMIN found for org ${organizationId}. Attempting to elect an owner...`,
      );
      const anyUser = await this.prisma.userOrganization.findFirst({
        where: { organizationId },
        include: { user: true },
        orderBy: { joinedAt: 'asc' }, // Oldest member first
      });

      if (!anyUser) {
        throw new NotFoundException(
          'This organization is empty. No user found to act as billing owner.',
        );
      }

      // Promote to ORG_ADMIN automatically
      await this.prisma.userOrganization.update({
        where: {
          userId_organizationId: {
            userId: anyUser.userId,
            organizationId,
          },
        },
        data: { role: UserRole.ORG_ADMIN },
      });

      orgUser = anyUser;
      this.logger.log(`User ${anyUser.userId} has been elected as ORG_ADMIN for ${organizationId}`);
    }

    let stripeCustomerId = orgUser.user.stripeCustomerId;

    if (!stripeCustomerId) {
      // Auto-provision Stripe Customer on the fly
      stripeCustomerId = await this.stripeService.createCustomer({
        email: orgUser.user.email,
        name: orgUser.user.displayName || orgUser.user.email,
        userId: orgUser.user.id,
        orgId: organizationId,
      });

      // Persist the brand new Stripe Customer ID
      await this.prisma.user.update({
        where: { id: orgUser.user.id },
        data: { stripeCustomerId },
      });
    }

    const url = await this.stripeService.createPortalSession(stripeCustomerId);
  }

  /**
   * Register a new member in an organization.
   * Syncs with Supabase Auth and creates an initial pending payment.
   */
  /**
   * Send welcome email to a new member with their credentials.
   */
  async sendWelcomeEmailToMember(data: {
    email: string;
    password: string;
    displayName: string;
    organizationName: string;
    loginUrl: string;
    role: string;
  }): Promise<boolean> {
    const { email, password, displayName, organizationName, loginUrl, role } = data;

    const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Welcome to ${organizationName}</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #020617;">
    <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <tr>
        <td style="text-align: center; padding-bottom: 40px;">
          <h1 style="color: #10b981; font-size: 32px; margin: 0 0 10px 0;">Welcome to ${organizationName}</h1>
          <p style="color: #94a3b8; font-size: 16px; margin: 0;">You've been added as a member!</p>
        </td>
      </tr>
      <tr>
        <td style="background-color: #1e293b; border-radius: 12px; padding: 32px;">
          <h2 style="color: #f8fafc; font-size: 20px; margin: 0 0 24px 0;">Your Account Details</h2>

          <div style="margin-bottom: 20px;">
            <label style="display: block; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Name</label>
            <div style="background-color: #0f172a; padding: 12px 16px; border-radius: 8px; color: #f8fafc; font-family: monospace;">${displayName}</div>
          </div>

          <div style="margin-bottom: 20px;">
            <label style="display: block; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Email</label>
            <div style="background-color: #0f172a; padding: 12px 16px; border-radius: 8px; color: #f8fafc; font-family: monospace;">${email}</div>
          </div>

          <div style="margin-bottom: 20px;">
            <label style="display: block; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Role</label>
            <div style="background-color: #0f172a; padding: 12px 16px; border-radius: 8px; color: #f8fafc; font-family: monospace;">${role}</div>
          </div>

          <div style="margin-bottom: 24px;">
            <label style="display: block; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Password</label>
            <div style="background-color: #0f172a; padding: 12px 16px; border-radius: 8px; color: #f8fafc; font-family: monospace;">${password}</div>
          </div>

          <a href="${loginUrl}" style="display: block; width: 100%; text-align: center; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Login Now
          </a>
        </td>
      </tr>
      <tr>
        <td style="text-align: center; padding-top: 32px; color: #64748b; font-size: 14px;">
          <p style="margin: 0;">Please change your password after your first login for security purposes.</p>
        </td>
      </tr>
    </table>
  </body>
</html>
    `;

    return await this.emailService.sendNotification(
      email,
      `Welcome to ${organizationName}`,
      htmlContent,
    );
  }

  async registerMember(
    organizationId: string,
    data: {
      email: string;
      displayName: string;
      password?: string;
      role?: UserRole;
      phoneNumber?: string;
      dateOfBirth?: string;
      membershipPlanId?: string;
    },
  ) {
    // Validate organizationId is a valid UUID and not "undefined"
    if (!organizationId || organizationId === 'undefined' || organizationId.length < 32) {
      throw new BadRequestException('ID de Organización inválido');
    }

    // 1. Check if user already exists in local DB
    let user = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    let authUserId: string | undefined = user?.id;
    let password = data.password;

    if (!user) {
      // 2. Create in Supabase Auth if not exists
      const supabaseUrl = this.config.get<string>('SUPABASE_URL');
      const supabaseServiceKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');

      if (!password) {
        password = randomBytes(6).toString('hex') + 'f!g';
      }

      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: data.email.toLowerCase(),
          password,
          email_confirm: true,
          user_metadata: {
            display_name: data.displayName,
          },
        });

        if (authError && authError.message !== 'User already registered') {
          this.logger.error(`Error creating Supabase member: ${authError.message}`);
          throw new BadRequestException(
            `Could not create authentication account: ${authError.message}`,
          );
        } else if (authData?.user) {
          authUserId = authData.user.id;
        } else {
          // If user already registered in Supabase but not in our DB
          const { data: existingAuth, error: findError } = await supabase.auth.admin.listUsers();
          const found = existingAuth?.users.find((u) => u.email === data.email.toLowerCase());
          if (found) authUserId = found.id;
        }
      }

      // 3. Create in local DB
      const hashedPassword = await argon2.hash(password);
      user = await this.prisma.user.create({
        data: {
          id: authUserId,
          email: data.email.toLowerCase(),
          displayName: data.displayName,
          passwordHash: hashedPassword,
          phoneNumber: data.phoneNumber,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          isActive: true,
          subscriptionStatus: 'active',
        },
      });
    }

    // 4. Link to organization
    const membership = await this.prisma.userOrganization.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId,
        },
      },
      update: { role: data.role || UserRole.CLIENT },
      create: {
        userId: user.id,
        organizationId,
        role: data.role || UserRole.CLIENT,
        membershipPlanId: data.membershipPlanId,
      },
    });

    // 5. Create initial pending payment based on plan (or default)
    let amount = 29.99;
    let notes = 'Suscripción inicial - 1 mes';

    if (data.membershipPlanId) {
      const plan = await this.prisma.membershipPlan.findUnique({
        where: { id: data.membershipPlanId },
      });
      if (plan) {
        amount = plan.price.toNumber();
        notes = `Suscripción inicial - ${plan.name} (${plan.frequency})`;
      }
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 5);

    await this.prisma.memberPayment.create({
      data: {
        organizationId,
        userId: user.id,
        amount,
        currency: 'USD',
        status: 'PENDING',
        dueDate,
        notes,
      },
    });

    return {
      success: true,
      data: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        password: password, // Return password (either provided or generated)
        role: membership.role,
        joinedAt: membership.joinedAt,
      },
    };
  }

  /**
   * Generate and send a payment link to a member.
   */
  async sendPaymentLink(organizationId: string, paymentId: string) {
    const payment = await this.prisma.memberPayment.findUnique({
      where: { id: paymentId },
      include: {
        user: true,
        organization: true,
      },
    });

    if (!payment || payment.organizationId !== organizationId) {
      throw new NotFoundException('Payment not found');
    }

    // Generate link (In a real scenario, this would integrate with Stripe or a custom checkout page)
    const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const paymentLink = `${frontendUrl}/pay/${payment.id}`;

    // Send email
    await this.emailService.sendPaymentLinkEmail({
      email: payment.user.email,
      displayName: payment.user.displayName,
      amount: payment.amount.toNumber(),
      currency: payment.currency,
      organizationName: payment.organization.name,
      paymentLink,
      dueDate: payment.dueDate,
    });

    return {
      success: true,
      message: 'Payment link sent successfully',
      data: { paymentLink },
    };
  }

  /**
   * Send payment confirmation email.
   */
  async sendPaymentConfirmation(data: {
    email: string;
    displayName: string;
    amount: number;
    currency: string;
    organizationName: string;
    paymentId: string;
  }): Promise<boolean> {
    const { email, displayName, amount, currency, organizationName, paymentId } = data;
    const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173';

    const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Payment Confirmed - ${organizationName}</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #020617;">
    <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <tr>
        <td style="text-align: center; padding-bottom: 40px;">
          <h1 style="color: #10b981; font-size: 32px; margin: 0 0 10px 0;">✅ Payment Confirmed</h1>
          <p style="color: #94a3b8; font-size: 16px; margin: 0;">Thank you for your payment!</p>
        </td>
      </tr>
      <tr>
        <td style="background-color: #1e293b; border-radius: 12px; padding: 32px;">
          <h2 style="color: #f8fafc; font-size: 20px; margin: 0 0 24px 0;">Payment Details</h2>

          <div style="margin-bottom: 20px;">
            <label style="display: block; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Amount Paid</label>
            <div style="background-color: #0f172a; padding: 12px 16px; border-radius: 8px; color: #10b981; font-family: monospace; font-size: 24px; font-weight: bold;">${amount} ${currency}</div>
          </div>

          <div style="margin-bottom: 24px;">
            <label style="display: block; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Organization</label>
            <div style="background-color: #0f172a; padding: 12px 16px; border-radius: 8px; color: #f8fafc; font-family: monospace;">${organizationName}</div>
          </div>

          <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 24px 0;">
            Your subscription has been activated. You can now access all features of the platform.
          </p>

          <a href="${frontendUrl}" style="display: block; width: 100%; text-align: center; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Go to Dashboard
          </a>
        </td>
      </tr>
    </table>
  </body>
</html>
    `;

    return await this.emailService.sendNotification(
      email,
      `Payment Confirmed - ${organizationName}`,
      htmlContent,
    );
  }

  /**
   * Send payment reminder email.
   */
  async sendPaymentReminder(data: {
    email: string;
    displayName: string;
    amount: number;
    currency: string;
    organizationName: string;
    dueDate: Date;
    paymentLink: string;
  }): Promise<boolean> {
    const { email, displayName, amount, currency, organizationName, dueDate, paymentLink } = data;

    const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Payment Reminder - ${organizationName}</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #020617;">
    <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <tr>
        <td style="text-align: center; padding-bottom: 40px;">
          <h1 style="color: #f59e0b; font-size: 32px; margin: 0 0 10px 0;">⏰ Payment Reminder</h1>
          <p style="color: #94a3b8; font-size: 16px; margin: 0;">Friendly reminder from ${organizationName}</p>
        </td>
      </tr>
      <tr>
        <td style="background-color: #1e293b; border-radius: 12px; padding: 32px;">
          <p style="color: #f8fafc; font-size: 16px; margin: 0 0 24px 0;">Hola ${displayName},</p>

          <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 24px 0;">
            This is a friendly reminder that your payment is due.
          </p>

          <div style="background-color: #0f172a; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <div style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Amount Due</div>
            <div style="color: #f59e0b; font-size: 36px; font-weight: 700;">${amount} ${currency}</div>
            <div style="color: #64748b; font-size: 14px; margin-top: 8px;">Due: ${dueDate.toLocaleDateString()}</div>
          </div>

          <a href="${paymentLink}" style="display: block; width: 100%; text-align: center; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Pay Now
          </a>
        </td>
      </tr>
    </table>
  </body>
</html>
    `;

    return await this.emailService.sendNotification(
      email,
      `Payment Reminder - ${organizationName}`,
      htmlContent,
    );
  }

  // ── Membership Plans ───────────────────────────────────────────────────────

  async getMembershipPlans(organizationId: string) {
    return this.prisma.membershipPlan.findMany({
      where: { organizationId, isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  async createMembershipPlan(
    organizationId: string,
    data: {
      name: string;
      description?: string;
      price: number;
      currency?: string;
      frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    },
  ) {
    return this.prisma.membershipPlan.create({
      data: {
        organizationId,
        name: data.name,
        description: data.description,
        price: data.price,
        currency: data.currency || 'USD',
        frequency: data.frequency,
      },
    });
  }

  async updateMembershipPlan(organizationId: string, planId: string, data: any) {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || plan.organizationId !== organizationId) {
      throw new NotFoundException('Plan not found for this organization');
    }

    return this.prisma.membershipPlan.update({
      where: { id: planId },
      data,
    });
  }
}
