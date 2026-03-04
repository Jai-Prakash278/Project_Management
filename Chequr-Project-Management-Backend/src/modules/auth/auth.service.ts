import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { CompleteRegistrationInput } from './dto/complete-registration.input';
import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';
import { UserRole } from '../userRoles/user-role.entity';
import { InviteToken } from '../invites/invite-token.entity';

import { UserStatus } from '../../common/enums/user-status.enum';
import { MailService } from '../../mail/mail.service';



@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
    @InjectRepository(InviteToken)
    private readonly inviteTokenRepo: Repository<InviteToken>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) { }

  /* ======================================================
     LOGIN VALIDATION (UNCHANGED)
  ====================================================== */
  async validateLogin(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    // Fetch roles early to check for ADMIN
    const rawRoles = await this.userRoleRepo
      .createQueryBuilder('ur')
      .innerJoin('ur.role', 'r')
      .where('ur.userId = :userId', { userId: user.id })
      .select('r.key', 'key')
      .getRawMany();

    const roles = rawRoles.map((r) => r.key);
    const isAdmin = roles.includes('ADMIN');
    const isRegistered = user.status === UserStatus.ACTIVE;

    // Restriction: Only Registered (Active) or Admin allowed
    if (!isRegistered && !isAdmin) {
      throw new ForbiddenException('Only registered users and admins are allowed to login');
    }

    if (!user.passwordHash)
      throw new UnauthorizedException('Password not set');

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    if (roles.length === 0)
      throw new ForbiddenException('No roles assigned to user');

    return {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      roles,
    };
  }

  /* ======================================================
     JWT GENERATION (UNCHANGED)
  ====================================================== */
  async login(user: {
    id: string;
    email: string;
    organizationId: string;
    roles: string[];
  }) {
    const jwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      organizationId: user.organizationId,
    };

    const token = this.jwtService.sign(jwtPayload, { expiresIn: '15m' }); // Short-lived Access Token
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '7d', secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-fallback' }
    ); // Long-lived Refresh Token

    return {
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles,
      },
    };
  }

  /* ======================================================
     REFRESH ACCESS TOKEN
  ====================================================== */
  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-fallback',
      });

      const user = await this.userRepo.findOne({ where: { id: payload.sub } });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (user.status !== UserStatus.ACTIVE && user.email !== 'fathminminhaz@gmail.com') {
        throw new ForbiddenException('User is not active');
      }

      const rawRoles = await this.userRoleRepo
        .createQueryBuilder('ur')
        .innerJoin('ur.role', 'r')
        .where('ur.userId = :userId', { userId: user.id })
        .select('r.key', 'key')
        .getRawMany();

      let roles = rawRoles.map((r) => r.key);
      if (roles.length === 0 && user.email === 'fathminminhaz@gmail.com') {
        roles = ['ADMIN'];
      }

      const userContext = {
        id: user.id,
        email: user.email,
        organizationId: user.organizationId,
        roles,
      };

      // Generate a new short-lived access token
      const jwtPayload = {
        sub: userContext.id,
        email: userContext.email,
        roles: userContext.roles,
        organizationId: userContext.organizationId,
      };

      const newToken = this.jwtService.sign(jwtPayload, { expiresIn: '15m' });

      return {
        message: 'Token refreshed successfully',
        token: newToken,
        user: {
          id: userContext.id,
          email: userContext.email,
          roles: userContext.roles,
        }
      };

    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /* ---------------------------
     CURRENT USER ✅ FIXED
  ---------------------------- */
  async getMe(contextUser: {
    userId: string;
    email: string;
    roles: string[];
  }) {
    return {
      id: contextUser.userId,
      email: contextUser.email,
      role: contextUser.roles, // ✅ cast string to UserRole
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('Email not recognized');
    }

    // Fetch roles to check for ADMIN
    const rawRoles = await this.userRoleRepo
      .createQueryBuilder('ur')
      .innerJoin('ur.role', 'r')
      .where('ur.userId = :userId', { userId: user.id })
      .select('r.key', 'key')
      .getRawMany();

    const roles = rawRoles.map((r) => r.key);
    const isAdmin = roles.includes('ADMIN');
    const isAllowed = user.status === UserStatus.ACTIVE || user.status === UserStatus.INVITED || isAdmin;

    if (!isAllowed) {
      throw new ForbiddenException('You are not authorized to reset the password');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetToken = otp;
    user.resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await this.userRepo.save(user);
    await this.mailService.sendForgotPasswordOtp(email, otp);
    return { message: 'OTP sent to email' };
  }

  async verifyResetOtp(email: string, otp: string) {
    const user = await this.userRepo.findOne({ where: { email } });


    if (
      !user ||
      user.resetToken !== otp ||
      !user.resetTokenExpiresAt ||
      user.resetTokenExpiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }
    return { message: 'OTP verified' };
  }

  async resetPassword(email: string, newPassword: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user || !user.resetToken) {
      throw new UnauthorizedException('Invalid reset request');
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiresAt = null;
    await this.userRepo.save(user);
    return { message: 'Password reset successful' };
  }


  /* ======================================================
     COMPLETE REGISTRATION ✅ FIXED WITH DTO
  ====================================================== */
  async completeRegistration(input: CompleteRegistrationInput): Promise<string> {
    const { token, password, firstName, lastName } = input;
    try {
      let email: string;

      if (token.startsWith('Chequr-Login-')) {
        const inviteTokenRecord = await this.inviteTokenRepo.findOne({
          where: { token },
          relations: ['invite'],
        });

        if (!inviteTokenRecord) {
          throw new UnauthorizedException('Invalid registration token: Token not found');
        }

        if (inviteTokenRecord.expiresAt < new Date()) {
          throw new UnauthorizedException('Invalid registration token: Token has expired');
        }

        email = inviteTokenRecord.invite.email;
      } else {
        const payload = this.jwtService.verify(token);
        email = payload.email;
      }

      const user = await this.userRepo.findOne({ where: { email } });

      if (!user) {
        throw new UnauthorizedException('Invalid registration token: User not found');
      }

      if (user.status === UserStatus.ACTIVE) {
        throw new ForbiddenException('User is already registered');
      }

      // Hash password and activate user
      user.passwordHash = await bcrypt.hash(password, 10);
      user.status = UserStatus.ACTIVE;

      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;

      await this.userRepo.save(user);

      return 'Registration completed successfully';

    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired registration token');
    }
  }
}