import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly logger = new Logger(MailService.name);
  private fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');

    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY is not set. Emails will not be sent. ' +
        'Sign up at https://resend.com and add the key to your environment.',
      );
    }

    this.resend = new Resend(apiKey || '');

    // Use a verified domain address, or the Resend test address for development
    this.fromEmail =
      this.configService.get<string>('EMAIL_FROM') ||
      'Chequr <onboarding@resend.dev>';

    this.logger.log(`MailService initialized (from: ${this.fromEmail})`);
  }

  async sendInviteEmail(email: string, token: string, role: string) {
    const rawFrontendUrl =
      this.configService.get<string>('FRONTEND_URL') || '';
    const frontendUrl = rawFrontendUrl.replace(/\/+$/, '');
    const inviteLink = `${frontendUrl}/register?token=${token}`;
    this.logger.log(`Generated Invite Link: ${inviteLink}`);

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: 'You are invited to Chequr',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #4f46e5;">Welcome to Chequr</h2>
            <p>You have been invited to join our platform with the role: <strong>${role}</strong></p>
            <p>Please click the button below to complete your registration and set your password:</p>
            <div style="margin: 30px 0;">
              <a href="${inviteLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Activate Your Account</a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">If the button above doesn't work, copy and paste this link into your browser:</p>
            <p style="color: #6b7280; font-size: 14px; word-break: break-all;">${inviteLink}</p>
          </div>
        `,
      });

      if (error) {
        this.logger.error(
          `Failed to send invitation email to ${email}: ${error.message}`,
        );
        return;
      }

      this.logger.log(
        `Invitation email sent to ${email} (id: ${data?.id})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send invitation email to ${email}. Error: ${error.message}`,
        error.stack,
      );
    }
  }

  async sendForgotPasswordOtp(email: string, otp: string) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: 'Chequr Password Reset OTP',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h3 style="color: #4f46e5;">Password Reset Request</h3>
            <p>We received a request to reset your password.</p>
            <p>Your One-Time Password (OTP) is:</p>
            <h2 style="letter-spacing: 3px; color: #111827;">${otp}</h2>
            <p>This OTP is valid for 15 minutes.</p>
            <p style="color: #6b7280; font-size: 14px;">If you did not request this, please ignore this email.</p>
          </div>
        `,
      });

      if (error) {
        this.logger.error(`Failed to send OTP to ${email}: ${error.message}`);
        throw new Error(`Email sending failed: ${error.message}`);
      }

      this.logger.log(`Password reset OTP sent to ${email} (id: ${data?.id})`);
    } catch (error) {
      this.logger.error('Failed to send password reset OTP', error);
      throw error;
    }
  }
}