import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface WelcomeEmailData {
  email: string;
  password: string;
  organizationName: string;
  loginUrl: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Send a welcome email with login credentials to a new organization admin.
   * Uses Supabase Edge Functions for email delivery if configured,
   * otherwise logs the email content for development.
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    const { email, password, organizationName, loginUrl } = data;

    const supabaseUrl = this.config.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    // If Supabase is configured, try to send via Supabase Edge Function
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            to: email,
            organizationName,
            password,
            loginUrl,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          this.logger.error(`Failed to send email via Supabase: ${error}`);
          // Fall through to development mode
        } else {
          this.logger.log(`Welcome email sent to ${email} via Supabase`);
          return true;
        }
      } catch (err: any) {
        this.logger.error(`Error sending email via Supabase: ${err.message}`);
        // Fall through to development mode
      }
    }

    // Development mode: Log the email content
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

    return true;
  }

  /**
   * Send a simple notification email (for future use)
   */
  async sendNotification(to: string, subject: string, body: string): Promise<boolean> {
    this.logger.log(`
══════════════════════════════════════════════════════════════
📧 NOTIFICATION EMAIL
══════════════════════════════════════════════════════════════
To: ${to}
Subject: ${subject}

${body}
══════════════════════════════════════════════════════════════
    `);

    return true;
  }
}