// src/modules/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../shared/redis.service';
import * as argon2 from 'argon2';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
};

const mockJwt = {
  signAsync: jest.fn().mockResolvedValue('mock.jwt.token'),
};

const mockConfig = {
  get: jest.fn((key: string) => {
    const values: Record<string, unknown> = {
      JWT_ACCESS_SECRET: 'a'.repeat(64),
      JWT_REFRESH_SECRET: 'b'.repeat(64),
      JWT_ACCESS_EXPIRES: '15m',
      JWT_REFRESH_EXPIRES: '7d',
      ARGON2_MEMORY: 8192, // Menos memoria en tests para velocidad
      ARGON2_ITERATIONS: 2, // Mínimo 2 requerido por argon2
      ARGON2_PARALLELISM: 1,
    };
    return values[key];
  }),
};

const mockRedis = {
  getClient: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue(null),
    exists: jest.fn().mockResolvedValue(0),
    setex: jest.fn().mockResolvedValue('OK'),
  }),
  sessions: {
    get: jest.fn().mockResolvedValue(null),
    exists: jest.fn().mockResolvedValue(0),
    setex: jest.fn().mockResolvedValue('OK'),
  },
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ── Register ─────────────────────────────────────────────────────────────

  describe('register()', () => {
    it('should create user and return token pair', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null); // email no existe
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-uuid',
        email: 'test@fitforge.com',
        displayName: 'Test User',
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({});

      const result = await service.register({
        email: 'test@fitforge.com',
        password: 'SecurePass1',
        displayName: 'Test User',
      });

      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.user.email).toBe('test@fitforge.com');
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({
          email: 'existing@fitforge.com',
          password: 'SecurePass1',
          displayName: 'User',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── Login ─────────────────────────────────────────────────────────────────

  describe('login()', () => {
    it('should return token pair for valid credentials', async () => {
      const hash = await argon2.hash('CorrectPass1', {
        type: argon2.argon2id,
        memoryCost: 8192,
        timeCost: 2,
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-uuid',
        email: 'test@fitforge.com',
        displayName: 'Test User',
        passwordHash: hash,
        isActive: true,
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({});

      const result = await service.login({
        email: 'test@fitforge.com',
        password: 'CorrectPass1',
      });

      expect(result.accessToken).toBeTruthy();
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hash = await argon2.hash('CorrectPass1', {
        type: argon2.argon2id,
        memoryCost: 8192,
        timeCost: 2,
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-uuid',
        email: 'test@fitforge.com',
        passwordHash: hash,
        isActive: true,
      });

      await expect(
        service.login({ email: 'test@fitforge.com', password: 'WrongPass1' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ghost@fitforge.com', password: 'AnyPass1' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── estimate1RM ───────────────────────────────────────────────────────────

  describe('estimate1RM logic', () => {
    // Importar directamente la función
    const { estimate1RM } = jest.requireActual('../sets/sets.module') as {
      estimate1RM: (w: number, r: number, rir: number) => number;
    };

    it('100kg x 8 reps @ RIR 2 should be ~133kg 1RM', () => {
      const result = estimate1RM(100, 8, 2);
      // repsToFailure = 10, resultado esperado ~133
      expect(result).toBeGreaterThan(125);
      expect(result).toBeLessThan(145);
    });

    it('should return weight when repsToFailure is 0', () => {
      const result = estimate1RM(100, 0, 0);
      expect(result).toBe(100);
    });

    it('higher RIR should give higher estimated 1RM', () => {
      const low = estimate1RM(100, 8, 0); // al fallo
      const high = estimate1RM(100, 8, 4); // 4 reps en reserva
      expect(high).toBeGreaterThan(low);
    });
  });
});
