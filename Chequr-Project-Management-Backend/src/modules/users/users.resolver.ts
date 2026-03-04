import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { InvitesService } from '../invites/invites.service';
import { TeamMember } from './dto/team-member.object'; // new object type for frontend table
import { UpdateUserInput } from './dto/update-user.input';
import { CurrentUser } from '../../common/decorators/current-user.decorator';


@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly invitesService: InvitesService,
  ) { }

  @ResolveField(() => [String])
  async roleKeys(@Parent() user: User): Promise<string[]> {
    // If roles are already loaded, use them
    if (user.roles && user.roles.length > 0 && user.roles[0].role) {
      return user.roles.map(ur => ur.role.key);
    }

    // Otherwise fetch from service
    const fullUser = await this.usersService.findById(user.id);
    return fullUser?.roles?.map(ur => ur.role.key) || [];
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard)
  async updateUserById(
    @CurrentUser() currentUser: any,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateUserInput,
  ): Promise<User> {
    const isAdmin = currentUser.roles.includes('ADMIN');

    // STRICT: Only ADMIN can update ANY user (including themselves via this mutation if needed, but mainly for management)
    if (!isAdmin) {
      throw new Error('You are not authorized to edit users. Admin access required.');
    }

    return this.usersService.updateUser(id, input);
  }

  // Get all users (scoped to organization, or ALL for Admin)
  @Query(() => [User])
  @UseGuards(JwtAuthGuard)
  async users(@CurrentUser() user: any): Promise<User[]> {
    const isAdmin = user.roles.some((r: any) => r.key === 'ADMIN' || r === 'ADMIN');
    return this.usersService.findAll(isAdmin ? undefined : user.organizationId);
  }

  // Get single user by ID
  @Query(() => User)
  @UseGuards(JwtAuthGuard)
  async user(@Args('id', { type: () => ID }) id: string): Promise<User | null> {
    return this.usersService.findById(id);
  }


  // Get user by email (admin only)
  @Query(() => User)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async userByEmail(@Args('email') email: string): Promise<User | null> {
    return this.usersService.findByEmail(email);
  }

  // ---------------------------
  // Organization team for frontend table
  // Returns Name, Email, Access, Status, Action
  @Query(() => [TeamMember])
  @UseGuards(JwtAuthGuard)
  async organizationTeam(
    @Args('orgId', { type: () => ID }) orgId: string,
    @CurrentUser() user: any
  ): Promise<TeamMember[]> {

    const isAdmin = user.roles.some((r: any) => r.key === 'ADMIN' || r === 'ADMIN');

    if (isAdmin) {
      return this.usersService.getAllTeamMembers();
    }

    const users = await this.usersService.getOrganizationTeam(orgId);

    return users;
  }




  // Delete user (admin only)
  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteUser(@Args('email') email: string): Promise<boolean> {
    return this.usersService.deleteByEmail(email);
  }



  // Backwards compatibility or self-update shortcut
  @Mutation(() => User)
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: any,
    @Args('input') input: UpdateUserInput,
  ): Promise<User> {
    return this.usersService.updateUser(user.id, input);
  }
}

