import { Injectable, ConflictException, NotFoundException, Logger, BadRequestException, Inject, forwardRef } from '@nestjs/common';
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
    private readonly config: ConfigService
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
    const generatedPassword = data.adminPassword || (randomBytes(4).toString('hex') + 'f!g');

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
          display_name: `${pendingOrg.adminFirstName || ''} ${pendingOrg.adminLastName || ''}`.trim(),
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

  async update(id: string, data: { name?: string; slug?: string; logoUrl?: string; planId?: string }) {
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
      include: { users: true }
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const userIds = org.users.map(u => u.userId);

    const deletedOrg = await this.prisma.organization.delete({
      where: { id },
    });

    if (userIds.length > 0) {
      await this.prisma.user.deleteMany({
        where: {
          id: { in: userIds },
          isGlobalAdmin: false
        }
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
      this.logger.warn(`No ORG_ADMIN found for org ${organizationId}. Attempting to elect an owner...`);
      const anyUser = await this.prisma.userOrganization.findFirst({
        where: { organizationId },
        include: { user: true },
        orderBy: { joinedAt: 'asc' }, // Oldest member first
      });

      if (!anyUser) {
        throw new NotFoundException('This organization is empty. No user found to act as billing owner.');
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
    return { url };
  }
}