import {
  Injectable,
  NotFoundException,
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Module,
  UseGuards,
  Logger,
  Headers,
  Req,
  RawBodyRequest,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { z } from 'zod';
import { Prisma, BodyMetric, UserRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BillingService } from '../billing/billing.service';
import { BillingModule } from '../billing/billing.module';
import { StripeService } from '../stripe/stripe.service';
import { StripeModule } from '../stripe/stripe.module';
import { Request } from 'express';
import Stripe from 'stripe';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserPlateResponse {
  id: string;
  userId: string;
  weightKg: Decimal;
  quantity: number;
  barWeightKg: Decimal;
}

export interface CalculationResult {
  platesPerSide: number[];
  actualWeightKg: number;
  targetKg: number;
  differenceKg: number;
  isExact: boolean;
}

type UserProfileResult = Prisma.UserGetPayload<{
  select: {
    id: true;
    email: true;
    displayName: true;
    unitSystem: true;
    heightCm: true;
    dateOfBirth: true;
    avatarUrl: true;
    gender: true;
    mainGoal: true;
    trainingLevel: true;
    activities: true;
    goalWeightKg: true;
    createdAt: true;
    _count: { select: { workoutSessions: true; personalRecords: true } };
  };
}>;

type UserUpdateResult = Prisma.UserGetPayload<{
  select: {
    id: true;
    email: true;
    displayName: true;
    unitSystem: true;
    heightCm: true;
    dateOfBirth: true;
    gender: true;
    mainGoal: true;
    trainingLevel: true;
    activities: true;
    goalWeightKg: true;
  };
}>;

// ── DTOs ──────────────────────────────────────────────────────────────────────

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(2).max(100).trim().optional(),
  unitSystem: z.enum(['METRIC', 'IMPERIAL']).optional(),
  heightCm: z.number().min(50).max(300).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['FEMALE', 'MALE', 'NON_BINARY', 'OTHER']).optional(),
  mainGoal: z.enum(['LOSE_WEIGHT', 'KEEP_FIT', 'GET_STRONGER', 'GAIN_MUSCLE_MASS']).optional(),
  trainingLevel: z.enum(['BEGINNER', 'IRREGULAR', 'MEDIUM', 'ADVANCED']).optional(),
  activities: z
    .array(z.enum(['STRETCH', 'CARDIO', 'YOGA', 'POWER_TRAINING', 'DANCING']))
    .optional(),
  goalWeightKg: z.number().min(20).max(500).optional(),
});
export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;

export const AddPlateSchema = z.object({
  weightKg: z.number().min(0.25).max(100),
  quantity: z.number().int().min(1).max(20).default(2),
  barWeightKg: z.number().min(0).max(50).default(20),
});
export type AddPlateDto = z.infer<typeof AddPlateSchema>;

export const CreateBodyMetricSchema = z.object({
  recordedAt: z.string().datetime().optional(),
  weightKg: z.number().min(20).max(500).optional(),
  bodyFatPct: z.number().min(1).max(70).optional(),
  waistCm: z.number().min(30).max(300).optional(),
  chestCm: z.number().min(30).max(300).optional(),
  hipsCm: z.number().min(30).max(300).optional(),
  armsCm: z.number().min(10).max(100).optional(),
  thighsCm: z.number().min(10).max(150).optional(),
  bmi: z.number().min(10).max(60).optional(),
  bodyWaterPct: z.number().min(20).max(85).optional(),
  boneMassKg: z.number().min(0.5).max(10).optional(),
  visceralFatRating: z.number().int().min(1).max(30).optional(),
  notes: z.string().max(500).optional(),
});
export type CreateBodyMetricDto = z.infer<typeof CreateBodyMetricSchema>;

export const QueryUsersSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().optional(),
  role: z.enum(['GLOBAL_ADMIN', 'ORG_ADMIN', 'TRAINER', 'CLIENT']).optional(),
  isActive: z.preprocess((val) => val === 'true', z.boolean()).optional(),
});
export type QueryUsersDto = z.infer<typeof QueryUsersSchema>;

export const AdminUpdateUserSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
  isGlobalAdmin: z.boolean().optional(),
  phoneNumber: z.string().max(20).optional().nullable(),
  position: z.string().max(100).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  website: z.string().url().max(255).optional().nullable(),
  shortBio: z.string().max(500).optional().nullable(),
  teamName: z.string().max(100).optional().nullable(),
  rank: z.string().max(100).optional().nullable(),
  office: z.string().max(100).optional().nullable(),
  businessEmail: z.string().email().max(255).optional().nullable(),
  billingAddress: z.string().max(500).optional().nullable(),
  billingState: z.string().max(100).optional().nullable(),
  billingZipCode: z.string().max(20).optional().nullable(),
  notificationSettings: z.any().optional().nullable(),
});
export type AdminUpdateUserDto = z.infer<typeof AdminUpdateUserSchema>;

export const AdminCreateUserSchema = AdminUpdateUserSchema.extend({
  email: z.string().email(),
  displayName: z.string().min(2).max(100),
  planId: z.string().uuid().optional(),
});
export type AdminCreateUserDto = z.infer<typeof AdminCreateUserSchema>;

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly billingService: BillingService,
  ) {}

  async getProfile(userId: string): Promise<UserProfileResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        unitSystem: true,
        heightCm: true,
        dateOfBirth: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            workoutSessions: true,
            personalRecords: true,
          },
        },
        gender: true,
        mainGoal: true,
        trainingLevel: true,
        activities: true,
        goalWeightKg: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserUpdateResult> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.displayName && { displayName: dto.displayName }),
        ...(dto.unitSystem && { unitSystem: dto.unitSystem }),
        ...(dto.heightCm && { heightCm: dto.heightCm }),
        ...(dto.dateOfBirth && { dateOfBirth: new Date(dto.dateOfBirth) }),
        ...(dto.gender && { gender: dto.gender }),
        ...(dto.mainGoal && { mainGoal: dto.mainGoal }),
        ...(dto.trainingLevel && { trainingLevel: dto.trainingLevel }),
        ...(dto.activities && { activities: dto.activities }),
        ...(dto.goalWeightKg && { goalWeightKg: dto.goalWeightKg }),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        unitSystem: true,
        heightCm: true,
        dateOfBirth: true,
        gender: true,
        mainGoal: true,
        trainingLevel: true,
        activities: true,
        goalWeightKg: true,
      },
    });
  }

  async getPlates(userId: string): Promise<UserPlateResponse[]> {
    return this.prisma.userPlate.findMany({
      where: { userId },
      orderBy: { weightKg: 'desc' },
    });
  }

  async addPlate(userId: string, dto: AddPlateDto): Promise<UserPlateResponse> {
    return this.prisma.userPlate.create({
      data: {
        userId,
        weightKg: dto.weightKg,
        quantity: dto.quantity,
        barWeightKg: dto.barWeightKg,
      },
    });
  }

  async removePlate(userId: string, plateId: string): Promise<{ deleted: boolean }> {
    const plate = await this.prisma.userPlate.findFirst({ where: { id: plateId, userId } });
    if (!plate) throw new NotFoundException('Plate not found');
    await this.prisma.userPlate.delete({ where: { id: plateId } });
    return { deleted: true };
  }

  calculatePlates(
    targetKg: number,
    barKg: number,
    availablePlates: Array<{ weightKg: number; quantity: number }>,
  ): CalculationResult {
    const perSide = (targetKg - barKg) / 2;
    const platesPerSide: number[] = [];
    let remaining = perSide;
    const sorted = [...availablePlates].sort((a, b) => b.weightKg - a.weightKg);
    for (const plate of sorted) {
      const maxPerSide = Math.floor(plate.quantity / 2);
      let used = 0;
      while (remaining >= plate.weightKg && used < maxPerSide) {
        platesPerSide.push(plate.weightKg);
        remaining -= plate.weightKg;
        used++;
      }
    }
    return {
      platesPerSide,
      actualWeightKg: barKg + platesPerSide.reduce((a, b) => a + b, 0) * 2,
      targetKg,
      differenceKg: +(remaining * 2).toFixed(2),
      isExact: remaining < 0.01,
    };
  }

  async getBodyMetrics(userId: string, limit = 30): Promise<BodyMetric[]> {
    return this.prisma.bodyMetric.findMany({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });
  }

  async createBodyMetric(userId: string, dto: CreateBodyMetricDto): Promise<BodyMetric> {
    const recordedAt = dto.recordedAt ? new Date(dto.recordedAt) : new Date();
    return this.prisma.bodyMetric.upsert({
      where: { userId_recordedAt: { userId, recordedAt } },
      create: {
        userId,
        recordedAt,
        weightKg: dto.weightKg,
        bodyFatPct: dto.bodyFatPct,
        waistCm: dto.waistCm,
        chestCm: dto.chestCm,
        hipsCm: dto.hipsCm,
        armsCm: dto.armsCm,
        thighsCm: dto.thighsCm,
        bmi: dto.bmi,
        bodyWaterPct: dto.bodyWaterPct,
        boneMassKg: dto.boneMassKg,
        visceralFatRating: dto.visceralFatRating,
        notes: dto.notes,
      },
      update: {
        weightKg: dto.weightKg,
        bodyFatPct: dto.bodyFatPct,
        waistCm: dto.waistCm,
        chestCm: dto.chestCm,
        hipsCm: dto.hipsCm,
        armsCm: dto.armsCm,
        thighsCm: dto.thighsCm,
        bmi: dto.bmi,
        bodyWaterPct: dto.bodyWaterPct,
        boneMassKg: dto.boneMassKg,
        visceralFatRating: dto.visceralFatRating,
        notes: dto.notes,
      },
    });
  }

  async getLatestBodyWeight(userId: string): Promise<number | null> {
    const latest = await this.prisma.bodyMetric.findFirst({
      where: { userId, weightKg: { not: null } },
      orderBy: { recordedAt: 'desc' },
      select: { weightKg: true },
    });
    return latest?.weightKg ? +latest.weightKg : null;
  }

  // ── Global Admin Methods ──────────────────────────────────────────────────

  async findAllUsers(query: QueryUsersDto) {
    const where: Prisma.UserWhereInput = {
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.search && {
        OR: [
          { email: { contains: query.search, mode: 'insensitive' } },
          { displayName: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        take: query.limit,
        skip: query.offset,
        orderBy: { createdAt: 'desc' },
        include: {
          organizations: {
            include: { organization: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, limit: query.limit, offset: query.offset };
  }

  async getGlobalStats() {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const [total, newUsers, activeUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: last30Days } } }),
      this.prisma.user.count({ where: { isActive: true } }),
    ]);

    return {
      total,
      newUsers,
      activeUsers,
      retention: total > 0 ? ((activeUsers / total) * 100).toFixed(1) : '0',
    };
  }

  async adminUpdateUser(id: string, data: AdminUpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: data as any, // Any cast due to schema updates not yet in types
      include: {
        organizations: {
          include: { organization: true },
        },
      },
    });
  }

  async adminCreateUser(data: AdminCreateUserDto) {
    const { planId, ...userData } = data;

    // If a planId is provided, we use the Stripe flow
    if (planId) {
      return this.createWithStripe({
        displayName: userData.displayName,
        email: userData.email,
        planId: planId,
        // ...userData
      });
    }

    return this.prisma.user.create({
      data: {
        ...(userData as any),
        isActive: true,
      },
    });
  }

  async adminRemoveUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ── Stripe Integration Methods ──────────────────────────────────────────

  async createWithStripe(dto: {
    displayName: string;
    email: string;
    planId: string;
    orgId?: string;
  }): Promise<{ user: any; checkoutUrl: string }> {
    // 1. Fetch plan from DB and ensure it's synced to Stripe
    const plan = await this.prisma.billingPlan.findUnique({ where: { id: dto.planId } });
    if (!plan) throw new NotFoundException(`Plan ${dto.planId} not found`);

    // Sync plan → Stripe Product + Price (idempotent)
    const stripePriceId = await this.stripeService.syncPlan({
      planId: plan.id,
      name: plan.name,
      amount: Number(plan.price),
      interval: (plan.interval as 'month' | 'year') || 'month',
    });

    // 2. Create Stripe Customer
    const stripeCustomerId = await this.stripeService.createCustomer({
      email: dto.email,
      name: dto.displayName,
      userId: 'pending', // will update after DB insert
      orgId: dto.orgId,
    });

    // 3. Save user to DB
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        displayName: dto.displayName,
        stripeCustomerId,
        stripePriceId,
        subscriptionStatus: 'pending',
        isActive: true,
      },
    });

    // 4. Update Stripe customer metadata with real userId (fire-and-forget)
    this.stripeService['stripe'].customers
      .update(stripeCustomerId, { metadata: { userId: user.id } })
      .catch((e) => this.logger.error('Failed to update Stripe metadata', e));

    // 5. Create Checkout Session → get the payment URL
    const { checkoutUrl } = await this.stripeService.createCheckoutSession({
      stripeCustomerId,
      stripePriceId,
      userId: user.id,
    });

    this.logger.log(`Created user ${user.id}, checkout URL: ${checkoutUrl}`);

    return { user, checkoutUrl };
  }

  async activateSubscription(
    userId: string,
    data: { stripeSubscriptionId: string; subscriptionStatus: string },
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        stripeSubscriptionId: data.stripeSubscriptionId,
        subscriptionStatus: data.subscriptionStatus,
      },
    });
  }

  async updateSubscriptionStatus(
    stripeCustomerId: string,
    status: 'active' | 'past_due' | 'canceled',
  ): Promise<void> {
    await this.prisma.user.update({
      where: { stripeCustomerId },
      data: { subscriptionStatus: status },
    });
  }

  async canAccessApp(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true, subscriptionStatus: true },
    });
    if (!user?.stripeCustomerId) return false;
    return user.subscriptionStatus === 'active';
  }
}

// ── Controller ────────────────────────────────────────────────────────────────

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── User Specific Endpoints ───────────────────────────────────────────────

  @Get('me')
  getProfile(@CurrentUser() user: AuthUser): Promise<UserProfileResult> {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(UpdateProfileSchema)) dto: UpdateProfileDto,
  ): Promise<UserUpdateResult> {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Get('me/plates')
  getPlates(@CurrentUser() user: AuthUser): Promise<UserPlateResponse[]> {
    return this.usersService.getPlates(user.id);
  }

  @Post('me/plates')
  @HttpCode(HttpStatus.CREATED)
  addPlate(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(AddPlateSchema)) dto: AddPlateDto,
  ): Promise<UserPlateResponse> {
    return this.usersService.addPlate(user.id, dto);
  }

  @Delete('me/plates/:plateId')
  removePlate(
    @CurrentUser() user: AuthUser,
    @Param('plateId', ParseUUIDPipe) plateId: string,
  ): Promise<{ deleted: boolean }> {
    return this.usersService.removePlate(user.id, plateId);
  }

  @Post('me/plates/calculate')
  async calculatePlates(
    @CurrentUser() user: AuthUser,
    @Query('targetKg') targetKg: string,
    @Query('barKg') barKg: string,
  ): Promise<CalculationResult> {
    const plates = await this.usersService.getPlates(user.id);
    return this.usersService.calculatePlates(
      parseFloat(targetKg),
      parseFloat(barKg ?? '20'),
      plates.map((p) => ({
        weightKg: Number(p.weightKg),
        quantity: p.quantity,
      })),
    );
  }

  @Get('me/metrics')
  getBodyMetrics(
    @CurrentUser() user: AuthUser,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<BodyMetric[]> {
    return this.usersService.getBodyMetrics(user.id, limit ?? 30);
  }

  @Post('me/metrics')
  @HttpCode(HttpStatus.CREATED)
  createBodyMetric(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateBodyMetricSchema)) dto: CreateBodyMetricDto,
  ): Promise<BodyMetric> {
    return this.usersService.createBodyMetric(user.id, dto);
  }

  // ── Global Admin Endpoints ────────────────────────────────────────────────

  @Get()
  @Roles(UserRole.GLOBAL_ADMIN)
  @UseGuards(RolesGuard)
  findAll(@Query(new ZodValidationPipe(QueryUsersSchema)) query: QueryUsersDto) {
    return this.usersService.findAllUsers(query);
  }

  @Get('stats')
  @Roles(UserRole.GLOBAL_ADMIN)
  @UseGuards(RolesGuard)
  getGlobalStats() {
    return this.usersService.getGlobalStats();
  }

  @Post()
  @Roles(UserRole.GLOBAL_ADMIN)
  @UseGuards(RolesGuard)
  adminCreate(@Body(new ZodValidationPipe(AdminCreateUserSchema)) dto: AdminCreateUserDto) {
    return this.usersService.adminCreateUser(dto);
  }

  @Patch(':id')
  @Roles(UserRole.GLOBAL_ADMIN)
  @UseGuards(RolesGuard)
  adminUpdate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(AdminUpdateUserSchema)) dto: AdminUpdateUserDto,
  ) {
    return this.usersService.adminUpdateUser(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.GLOBAL_ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  adminRemove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.adminRemoveUser(id);
  }
}

// ── Webhook Controller ────────────────────────────────────────────────────────

@Controller('webhooks/stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  private async logEvent(userId: string, type: string, payload: any) {
    if (!userId) return;
    try {
      await this.prisma.eventLog.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          eventType: type,
          payload: payload || {},
          source: 'stripe-webhook',
        },
      });
    } catch (e) {
      this.logger.error(`Failed to log event ${type} for user ${userId}`, e);
    }
  }

  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) throw new BadRequestException('Missing stripe-signature header');

    let event: Stripe.Event;
    try {
      event = this.stripeService.constructWebhookEvent(req.rawBody!, signature);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Webhook signature verification failed: ${message}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Webhook received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.payment_status === 'paid') {
          const userId = session.metadata?.userId;
          if (userId) {
            await this.usersService.activateSubscription(userId, {
              stripeSubscriptionId: session.subscription as string,
              subscriptionStatus: 'active',
            });
            this.logger.log(`User ${userId} subscription activated`);
            await this.logEvent(userId, event.type, {
              sessionId: session.id,
              subscriptionId: session.subscription,
            });
          }
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const user = await this.prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
          select: { id: true },
        });
        if (user) {
          await this.usersService.updateSubscriptionStatus(customerId, 'active');
          await this.logEvent(user.id, event.type, {
            amount: invoice.amount_paid,
            invoiceId: invoice.id,
          });
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const user = await this.prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
          select: { id: true },
        });
        if (user) {
          await this.usersService.updateSubscriptionStatus(customerId, 'past_due');
          this.logger.warn(`Payment failed for customer ${customerId}`);
          await this.logEvent(user.id, event.type, {
            amount: invoice.amount_due,
            invoiceId: invoice.id,
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const user = await this.prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
          select: { id: true },
        });
        if (user) {
          await this.usersService.updateSubscriptionStatus(customerId, 'canceled');
          await this.logEvent(user.id, event.type, { subscriptionId: sub.id });
        }
        break;
      }
      default:
        this.logger.debug(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }
}

// ── Module ────────────────────────────────────────────────────────────────────

@Module({
  imports: [BillingModule, StripeModule],
  controllers: [UsersController, StripeWebhookController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
