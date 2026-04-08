import { Test, TestingModule } from '@nestjs/testing';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { PrismaService } from '../../database/prisma.service';

describe('StripeController - customer.updated', () => {
  let controller: StripeController;
  let prisma: PrismaService;

  const mockStripeService = {
    constructWebhookEvent: jest.fn(),
  };

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripeController],
      providers: [
        { provide: StripeService, useValue: mockStripeService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    controller = module.get<StripeController>(StripeController);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should process customer.updated event with valid userId', async () => {
    const mockCustomer = {
      id: 'cus_123456',
      metadata: {
        userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      },
      name: 'John Doe',
      email: 'john@example.com',
    };

    const mockEvent = {
      type: 'customer.updated',
      data: {
        object: mockCustomer,
      },
    };

    mockStripeService.constructWebhookEvent.mockReturnValue(mockEvent);

    const mockRequest = {
      rawBody: Buffer.from('test'),
      headers: {
        'stripe-signature': 'test-signature',
      },
    } as any;

    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as any;

    await controller.handleWebhook('test-signature', mockRequest, mockResponse);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
      data: {
        stripeCustomerId: 'cus_123456',
        displayName: 'John Doe',
      },
    });

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.send).toHaveBeenCalledWith({ received: true });
  });

  it('should log warning when customer.updated has no userId in metadata', async () => {
    const mockCustomer = {
      id: 'cus_123456',
      metadata: {},
      name: 'John Doe',
    };

    const mockEvent = {
      type: 'customer.updated',
      data: {
        object: mockCustomer,
      },
    };

    mockStripeService.constructWebhookEvent.mockReturnValue(mockEvent);

    const mockRequest = {
      rawBody: Buffer.from('test'),
      headers: {
        'stripe-signature': 'test-signature',
      },
    } as any;

    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as any;

    await controller.handleWebhook('test-signature', mockRequest, mockResponse);

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });
});
