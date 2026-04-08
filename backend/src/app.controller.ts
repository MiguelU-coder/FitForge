import { Controller, Get, Param, Res, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';
import { Response } from 'express';
import { Public } from './common/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get('c/:shortId')
  async redirectCheckout(@Param('shortId') shortId: string, @Res() res: Response) {
    const link = await this.prisma.checkoutLink.findUnique({
      where: { shortId },
    });
    if (!link) {
      throw new NotFoundException('Invalid or expired checkout link');
    }
    this.logger.log(`Redirecting short ID ${shortId} to ${link.url}`);
    return res.redirect(302, link.url);
  }

  @Public()
  @Get('payment/success')
  handlePaymentSuccess(@Res() res: Response) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      this.configService.get<string>('CORS_ORIGINS')?.split(',')[0] ||
      'http://localhost:5173';

    const targetUrl = `${frontendUrl.replace(/\/$/, '')}/login?payment_success=true`;
    this.logger.log(`Redirecting SUCCESS to: ${targetUrl}`);

    return res.redirect(302, targetUrl);
  }

  @Public()
  @Get('payment/cancel')
  handlePaymentCancel(@Res() res: Response) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      this.configService.get<string>('CORS_ORIGINS')?.split(',')[0] ||
      'http://localhost:5173';

    const targetUrl = `${frontendUrl.replace(/\/$/, '')}/login?payment_canceled=true`;
    this.logger.log(`Redirecting CANCEL to: ${targetUrl}`);

    return res.redirect(302, targetUrl);
  }
}
