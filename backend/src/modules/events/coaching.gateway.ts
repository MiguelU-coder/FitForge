// ─────────────────────────────────────────────────────────────────────────────
// FitForge — Coaching WebSocket Gateway
//
// Subscribes to Redis pub/sub channels and forwards messages to the
// connected Flutter client in real-time.
//
// Channel convention:  user:{userId}:coaching
// ─────────────────────────────────────────────────────────────────────────────

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { RedisService } from '../../shared/redis.service';

interface AuthenticatedSocket extends Socket {
  userId: string;
}

@WebSocketGateway({
  namespace: '/coaching',
  cors: { origin: '*' }, // tighten in production
  transports: ['websocket'],
})
export class CoachingGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(CoachingGateway.name);

  // Map<userId, subscriber Redis client>
  private readonly subscribers = new Map<string, Redis>();

  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
  ) {}

  afterInit(): void {
    this.logger.log('CoachingGateway initialised');
  }

  // ─── Connection ───────────────────────────────────────────────────────────

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token = this.extractToken(client);
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      client.userId = payload.sub as string;

      this.logger.log(`Client connected: ${client.id} user:${client.userId}`);
      await this.subscribeToUserChannel(client);
    } catch {
      this.logger.warn(`Rejected unauthenticated connection: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    this.logger.log(`Client disconnected: ${client.id} user:${client.userId}`);
    this.teardownSubscription(client.userId);
  }

  // ─── Client subscribes to coaching feed ──────────────────────────────────

  @SubscribeMessage('subscribe_coaching')
  async handleSubscribe(@ConnectedSocket() client: AuthenticatedSocket): Promise<void> {
    // Already set up in handleConnection — this is for manual re-subscription
    await this.subscribeToUserChannel(client);
    client.emit('subscribed', { channel: `user:${client.userId}:coaching` });
  }

  // ─── Redis pub/sub subscription setup ────────────────────────────────────

  private async subscribeToUserChannel(client: AuthenticatedSocket): Promise<void> {
    const { userId } = client;
    const channel = `user:${userId}:coaching`;

    // Each user gets their own dedicated Redis subscriber connection
    if (this.subscribers.has(userId)) return;

    // Get the base client and duplicate it for pub/sub
    const baseClient = this.redisService.cache;
    const subscriber = baseClient.duplicate();
    await subscriber.subscribe(channel);

    subscriber.on('message', (_ch: string, message: string) => {
      try {
        const parsed = JSON.parse(message);
        client.emit('coaching_update', parsed);
        this.logger.debug(`Delivered coaching update to user:${userId} type:${parsed.type}`);
      } catch (e) {
        this.logger.error(`Failed to parse pub/sub message: ${e}`);
      }
    });

    this.subscribers.set(userId, subscriber);
    this.logger.debug(`Subscribed to ${channel}`);
  }

  private teardownSubscription(userId: string): void {
    const subscriber = this.subscribers.get(userId);
    if (subscriber) {
      subscriber.disconnect();
      this.subscribers.delete(userId);
    }
  }

  // ─── JWT token extraction ─────────────────────────────────────────────────

  private extractToken(client: Socket): string {
    const token =
      client.handshake.auth?.token ??
      client.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('No token');
    return token;
  }

  // ─── Server-side push (used by internal services) ────────────────────────

  pushToUser(userId: string, event: Record<string, unknown>): void {
    this.server.to(userId).emit('coaching_update', event);
  }
}
