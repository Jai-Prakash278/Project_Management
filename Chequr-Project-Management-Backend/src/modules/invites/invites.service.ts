import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

import { Invite } from './invite.entity';
import { InviteToken } from './invite-token.entity';
import { MailService } from '../../mail/mail.service';
import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';
import { UserRole } from '../userRoles/user-role.entity';
import { UserStatus } from '../../common/enums/user-status.enum';

@Injectable()
export class InvitesService {
  constructor(
    @InjectRepository(Invite)
    private readonly inviteRepository: Repository<Invite>,

    @InjectRepository(InviteToken)
    private readonly inviteTokenRepository: Repository<InviteToken>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,

    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) { }

  async inviteUser(data: {
    email: string;
    roles: string[];
    firstName?: string;
    lastName?: string;
    phone?: string;
    employeeId?: string;
    organizationId?: string;
    managerId?: string;
    reportingManager?: string;
  }): Promise<string> {
    const { email, roles, firstName, lastName, phone, employeeId, organizationId, reportingManager } = data;

    // 1. Check if user already exists
    let user = await this.userRepo.findOne({ where: { email } });

    if (user && user.status === UserStatus.ACTIVE) {
      // Assign Roles even if user is active
      await this.assignRolesToUser(user, roles, organizationId);
      return `User ${email} is already active. Roles assigned successfully.`;
    }

    if (!user) {
      user = this.userRepo.create({
        email,
        firstName,
        lastName,
        phone,
        employeeId,
        reportingManager,
        organizationId,
        status: UserStatus.INACTIVE,
      });
    } else {
      // Update existing inactive/invited user
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      if (phone) user.phone = phone;
      user.employeeId = employeeId || user.employeeId;
      user.reportingManager = reportingManager || user.reportingManager;
      user.status = UserStatus.INACTIVE;
    }

    await this.userRepo.save(user);

    // 2. Assign Roles
    await this.assignRolesToUser(user, roles, organizationId);

    // 3. Generate Custom Token and Save to DB
    const randomHex = crypto.randomBytes(16).toString('hex');
    const customToken = `Chequr-Login-${randomHex}`;

    // Create Invite Record
    const invite = this.inviteRepository.create({
      email,
      role: roles[0] || 'USER',
    });
    const savedInvite = await this.inviteRepository.save(invite);

    // Create InviteToken Record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

    const inviteToken = this.inviteTokenRepository.create({
      inviteId: savedInvite.id,
      token: customToken,
      expiresAt,
    });
    await this.inviteTokenRepository.save(inviteToken);

    // 4. Send Email with custom token
    await this.mailService.sendInviteEmail(email, customToken, roles[0] || 'USER');

    return `Invitation sent to ${email}`;
  }

  private async assignRolesToUser(user: User, roles: string[], organizationId?: string) {
    if (!roles || roles.length === 0) return;

    for (const roleKey of roles) {
      const normalizedKey = roleKey.toUpperCase();
      let roleEntity = await this.roleRepo.findOne({
        where: { key: normalizedKey },
      });

      // ✅ DYNAMIC ROLE CREATION
      if (!roleEntity) {
        // If role doesn't exist, create it dynamically
        roleEntity = this.roleRepo.create({
          key: normalizedKey,
          name: normalizedKey.charAt(0) + normalizedKey.slice(1).toLowerCase(), // Simple capitalization
          isSystemRole: false,
          organizationId: organizationId || user.organizationId,
        });
        await this.roleRepo.save(roleEntity);
      }

      // Check if role already assigned
      const existingUserRole = await this.userRoleRepo.findOne({
        where: { userId: user.id, roleId: roleEntity.id },
      });

      if (!existingUserRole) {
        const userRole = this.userRoleRepo.create({
          userId: user.id,
          roleId: roleEntity.id,
          organizationId: organizationId || roleEntity.organizationId,
          assignedBy: user.id, // Assuming self-assignment for invite flow, or could be context user
        });
        await this.userRoleRepo.save(userRole);
      }
    }
  }

  async sendBulkInvites(users: any[], organizationId?: string): Promise<string[]> {
    const results: string[] = [];
    for (const userData of users) {
      try {
        // Handle both single role (from BulkInviteInput) and multiple roles
        const roles = userData.roles || (userData.role ? [userData.role] : []);
        const result = await this.inviteUser({ ...userData, roles, organizationId });
        results.push(result);
      } catch (error) {
        results.push(`Failed to invite ${userData.email}: ${error.message}`);
      }
    }
    return results;
  }

  async getInviteData(token: string): Promise<User> {
    try {
      let emailToLookup: string;

      // Check if it's the new custom token format
      if (token.startsWith('Chequr-Login-')) {
        const inviteTokenRecord = await this.inviteTokenRepository.findOne({
          where: { token },
          relations: ['invite'],
        });

        if (!inviteTokenRecord) {
          throw new BadRequestException('Invalid invitation token');
        }

        if (inviteTokenRecord.expiresAt < new Date()) {
          throw new BadRequestException('Invitation token has expired');
        }

        emailToLookup = inviteTokenRecord.invite.email;
      } else {
        // Fallback to legacy JWT verification
        const payload = this.jwtService.verify(token);
        emailToLookup = payload.email;
      }

      const user = await this.userRepo.findOne({
        where: { email: emailToLookup },
      });

      if (!user) {
        throw new NotFoundException('User not found for this invitation');
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error; // Re-throw custom exceptions
      }
      throw new BadRequestException('Invalid or expired invitation token');
    }
  }

  // Keeping findByToken for backward compatibility if needed, but updated to use userRepo
  async findByToken(token: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(token);
      return this.userRepo.findOne({ where: { email: payload.email } });
    } catch (e) {
      return null;
    }
  }
}
