import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { InvitesService } from "./invites.service";
import { Roles } from "../../common/decorators/roles.decorator";
import { InviteUserInput } from "./dto/invite-user.input";
import { BulkInviteInput } from "./dto/bulk-invite.input";
import { User } from "../users/user.entity";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Resolver()
export class InvitesResolver {
  constructor(private readonly invitesService: InvitesService) { }

  @Mutation(() => String)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async inviteUser(
    @Args('input') input: InviteUserInput,
    @CurrentUser() user: any,
  ): Promise<string> {
    return this.invitesService.inviteUser({
      ...input,
      organizationId: user.organizationId,
    });
  }

  @Mutation(() => [String])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async sendBulkInvites(
    @Args({ name: 'users', type: () => [BulkInviteInput] })
    users: BulkInviteInput[],
    @CurrentUser() user: any,
  ): Promise<string[]> {
    return this.invitesService.sendBulkInvites(users, user.organizationId);
  }

  @Query(() => User)
  async getInviteData(
    @Args('token') token: string,
  ): Promise<User> {
    return this.invitesService.getInviteData(token);
  }
}
