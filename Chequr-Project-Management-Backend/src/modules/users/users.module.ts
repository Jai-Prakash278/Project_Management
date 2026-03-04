import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { UsersService } from "./users.service";
import { UsersResolver } from "./users.resolver";
import { UserRole } from "../userRoles/user-role.entity";
import { Role } from "../roles/role.entity";

import { InvitesModule } from "../invites/invites.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserRole, Role]),
    InvitesModule,
  ],
  providers: [UsersService, UsersResolver],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule { }
