import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface WelcomeEmailData {
  email: string;
  password: string;
  organizationName: string;
  loginUrl: string;
}

export interface PaymentLinkEmailData {
  email: string;
  displayName: string;
  amount: number;
  currency: string;
  organizationName: string;
  paymentLink: string;
  dueDate: Date | null;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly fromEmail: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.fromEmail = this.config.get<string>('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('✅ Resend initialized');
    } else {
      this.resend = null;
      this.logger.warn(
        '⚠️ RESEND_API_KEY not configured - emails will only be logged in development mode',
      );
    }
  }

  /**
   * Send a welcome email with login credentials to a new organization admin.
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    const { email, password, organizationName, loginUrl } = data;

    if (!this.resend) {
      return this.sendDevelopmentEmail('welcome', data);
    }

    try {
      await this.resend.emails.send({
        from: `FitForge <${this.fromEmail}>`,
        to: [email],
        subject: `Welcome to ${organizationName} - Your Login Credentials`,
        html: this.buildWelcomeEmailHtml(data),
      });

      this.logger.log(`Welcome email sent to ${email} via Resend`);
      return true;
    } catch (err: any) {
      this.logger.error(`Error sending email via Resend: ${err.message}`);
      // Fallback to development mode
      return this.sendDevelopmentEmail('welcome', data);
    }
  }

  /**
   * Send a payment link email to a member.
   */
  async sendPaymentLinkEmail(data: PaymentLinkEmailData): Promise<boolean> {
    const { email } = data;

    if (!this.resend) {
      return this.sendDevelopmentEmail('payment', data);
    }

    try {
      await this.resend.emails.send({
        from: `FitForge <${this.fromEmail}>`,
        to: [email],
        subject: `Enlace de Pago - ${data.organizationName}`,
        html: this.buildPaymentEmailHtml(data),
      });

      this.logger.log(`Payment link email sent to ${email} via Resend`);
      return true;
    } catch (err: any) {
      this.logger.error(`Error sending payment email via Resend: ${err.message}`);
      // Fallback to development mode
      return this.sendDevelopmentEmail('payment', data);
    }
  }

  /**
   * Send a generic notification email.
   */
  async sendNotification(to: string, subject: string, htmlContent: string): Promise<boolean> {
    if (!this.resend) {
      this.logger.log(`
══════════════════════════════════════════════════════════════
📧 NOTIFICATION EMAIL (Development Mode)
══════════════════════════════════════════════════════════════
To: ${to}
Subject: ${subject}

${htmlContent.replace(/<[^>]*>/g, '')}
══════════════════════════════════════════════════════════════
      `);
      return true;
    }

    try {
      await this.resend.emails.send({
        from: `FitForge <${this.fromEmail}>`,
        to: [to],
        subject,
        html: htmlContent,
      });

      this.logger.log(`Notification email sent to ${to} via Resend`);
      return true;
    } catch (err: any) {
      this.logger.error(`Error sending notification email via Resend: ${err.message}`);
      return false;
    }
  }

  /**
   * Development mode: Log email content to console.
   */
  private async sendDevelopmentEmail(type: 'welcome' | 'payment', data: any): Promise<boolean> {
    if (type === 'welcome') {
      const { email, password, organizationName, loginUrl } = data;
      this.logger.log(`
══════════════════════════════════════════════════════════════
📧 WELCOME EMAIL (Development Mode)
══════════════════════════════════════════════════════════════
To: ${email}
Subject: Welcome to ${organizationName} - Your Login Credentials

Your account has been created successfully!

Organization: ${organizationName}
Email: ${email}
Password: ${password}

Login at: ${loginUrl}

Please change your password after your first login.
══════════════════════════════════════════════════════════════
      `);
    } else if (type === 'payment') {
      const { email, displayName, amount, currency, organizationName, paymentLink, dueDate } = data;
      this.logger.log(`
══════════════════════════════════════════════════════════════
📧 PAYMENT LINK EMAIL (Development Mode)
══════════════════════════════════════════════════════════════
To: ${email}
Subject: Enlace de Pago - ${organizationName}

Hola ${displayName},

Se ha generado un cobro por tu suscripción en ${organizationName}.

Monto: ${amount} ${currency}
Vence: ${dueDate ? dueDate.toLocaleDateString() : 'Inmediato'}

Puedes realizar tu pago de forma segura en el siguiente enlace:
${paymentLink}

¡Gracias por ser parte de nuestra comunidad!
══════════════════════════════════════════════════════════════
      `);
    }

    return true;
  }

  /**
   * Build HTML email for welcome emails.
   */
  private buildWelcomeEmailHtml(data: WelcomeEmailData): string {
    const { organizationName, email, password, loginUrl } = data;

    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Welcome to ${organizationName}</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #020617;">
    <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <tr>
        <td style="text-align: center; padding-bottom: 40px;">
          <h1 style="color: #10b981; font-size: 32px; margin: 0 0 10px 0;">🎉 Welcome to ${organizationName}</h1>
          <p style="color: #94a3b8; font-size: 16px; margin: 0;">Your account has been created successfully!</p>
        </td>
      </tr>
      <tr>
        <td style="background-color: #1e293b; border-radius: 12px; padding: 32px;">
          <h2 style="color: #f8fafc; font-size: 20px; margin: 0 0 24px 0;">Your Login Credentials</h2>

          <div style="margin-bottom: 20px;">
            <label style="display: block; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Email</label>
            <div style="background-color: #0f172a; padding: 12px 16px; border-radius: 8px; color: #f8fafc; font-family: monospace;">${email}</div>
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
  }

  /**
   * Build HTML email for payment link emails.
   */
  private buildPaymentEmailHtml(data: PaymentLinkEmailData): string {
    const { displayName, organizationName, amount, currency, paymentLink, dueDate } = data;

    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Payment Link - ${organizationName}</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #020617;">
    <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <tr>
        <td style="text-align: center; padding-bottom: 40px;">
          <h1 style="color: #3b82f6; font-size: 32px; margin: 0 0 10px 0;">💳 Payment Request</h1>
          <p style="color: #94a3b8; font-size: 16px; margin: 0;">from ${organizationName}</p>
        </td>
      </tr>
      <tr>
        <td style="background-color: #1e293b; border-radius: 12px; padding: 32px;">
          <p style="color: #f8fafc; font-size: 16px; margin: 0 0 24px 0;">Hola ${displayName},</p>

          <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 24px 0;">
            Se ha generado un cobro por tu suscripción en <strong style="color: #f8fafc;">${organizationName}</strong>.
          </p>

          <div style="background-color: #0f172a; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <div style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Amount Due</div>
            <div style="color: #10b981; font-size: 36px; font-weight: 700;">${amount} ${currency}</div>
            ${dueDate ? `<div style="color: #f59e0b; font-size: 14px; margin-top: 8px;">Due: ${dueDate.toLocaleDateString()}</div>` : ''}
          </div>

          <a href="${paymentLink}" style="display: block; width: 100%; text-align: center; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Pay Now
          </a>
        </td>
      </tr>
      <tr>
        <td style="text-align: center; padding-top: 32px; color: #64748b; font-size: 14px;">
          <p style="margin: 0;">¡Gracias por ser parte de nuestra comunidad!</p>
        </td>
      </tr>
    </table>
  </body>
</html>
    `;
  }
}
