import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtStrategy } from './jwt.strategy';

import { jwtConfig } from '../../config/jwt.config';

import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';
import { UserRole } from '../userRoles/user-role.entity';
import { InviteToken } from '../invites/invite-token.entity';

import { MailModule } from '../../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      UserRole,
      InviteToken,
    ]),

    JwtModule.registerAsync({
      useFactory: jwtConfig,
    }),

    MailModule,
  ],

  providers: [
    AuthService,
    AuthResolver,
    JwtStrategy,
  ],

  exports: [
    AuthService,
    JwtModule,
  ],
})
export class AuthModule { }
