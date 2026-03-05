import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: any;
  private readonly logger = new Logger(MailService.name);
  private smtpUser: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    this.smtpUser = this.configService.get<string>('SMTP_USER') || '';
    const pass = this.configService.get<string>('SMTP_PASSWORD');

    this.logger.log(`Initializing MailService with host: ${host}, port: ${port}, user: ${this.smtpUser}`);

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user: this.smtpUser,
        pass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection on startup
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('SMTP Connection Error:', error);
      } else {
        this.logger.log('SMTP Server is ready to take our messages');
      }
    });
  }

  async sendInviteEmail(email: string, token: string, role: string) {
    const rawFrontendUrl = this.configService.get<string>('FRONTEND_URL') || '';
    const frontendUrl = rawFrontendUrl.replace(/\/+$/, ''); // Remove one or more trailing slashes
    const inviteLink = `${frontendUrl}/register?token=${token}`;
    this.logger.log(`Generated Invite Link: ${inviteLink}`);

    try {
      await this.transporter.sendMail({
        from: `"Chequr" <${this.smtpUser}>`,
        to: email,
        subject: 'You are invited to Chequr',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; rounded: 8px;">
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
      this.logger.log(`Invitation email successfully sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send invitation email to ${email}. Error: ${error.message}`, error.stack);
    }
  }

  async sendForgotPasswordOtp(email: string, otp: string) {
    try {
      await this.transporter.sendMail({
        from: `"Chequr" <${this.smtpUser}>`,
        to: email,
        subject: 'Chequr Password Reset OTP',
        html: `
          <h3>Password Reset Request</h3>
          <p>We received a request to reset your password.</p>
          <p>Your One-Time Password (OTP) is:</p>
          <h2 style="letter-spacing: 3px;">${otp}</h2>
          <p>This OTP is valid for 15 min.</p>
          <p>If you did not request this, please ignore this email.</p>
        `,
      });

      this.logger.log(`Password reset OTP sent to ${email}`);
    } catch (error) {
      this.logger.error('Failed to send password reset OTP', error);
      throw error;
    }
  }
}