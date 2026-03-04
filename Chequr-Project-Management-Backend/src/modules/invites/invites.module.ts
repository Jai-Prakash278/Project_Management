import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { InvitesResolver } from './invites.resolver';
import { Invite } from './invite.entity';
import { InviteToken } from './invite-token.entity';
import { MailModule } from '../../mail/mail.module';  // Using your mail module
import { InvitesService } from './invites.service';
import { AuthModule } from '../auth/auth.module';
import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';
import { UserRole } from '../userRoles/user-role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invite, InviteToken, User, Role, UserRole]),
    MailModule,  // For email sending
    AuthModule,
  ],
  providers: [InvitesService, InvitesResolver],
  exports: [InvitesService],
})
export class InvitesModule { }