import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserRole } from '../userRoles/user-role.entity';
import { TeamMember } from './dto/team-member.object';
import { UpdateUserInput } from './dto/update-user.input';
import { Role } from '../roles/role.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) { }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.role'],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        organizationId: true,
        createdAt: true,
        phone: true,
        employeeId: true,
        reportingManager: true,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['roles', 'roles.role'],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        organizationId: true,
        createdAt: true,
        phone: true,
        employeeId: true,
        reportingManager: true,
      },
    });
  }

  async deleteByEmail(email: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) return false;

    // Manually delete associated roles first to avoid FK constraint violation
    await this.userRoleRepository.delete({ userId: user.id });

    await this.usersRepository.remove(user);
    return true;
  }

  async getOrganizationTeam(orgId: string): Promise<TeamMember[]> {
    const rawUsers = await this.usersRepository
      .createQueryBuilder('u')
      .leftJoin('u.roles', 'ur')
      .leftJoin('ur.role', 'r')
      .where('u.organizationId = :orgId', { orgId })
      .select([
        'u.id as "id"',
        "CONCAT(u.firstName, ' ', u.lastName) as \"name\"",
        'u.email as "email"',
        "COALESCE(STRING_AGG(DISTINCT r.key, ', '), 'MEMBER') as \"roles\"",
        'u.firstName as "firstName"',
        'u.lastName as "lastName"',
        "u.status as \"status\"",
        'u.phone as "phone"',
        'u.employee_id as "employeeId"',
        'u.reporting_manager as "reportingManager"',
      ])
      .groupBy('u.id')
      .addGroupBy('u.firstName') // Included in select via CONCAT, but GROUP BY needs individual columns
      .addGroupBy('u.lastName')
      .addGroupBy('u.email')
      .addGroupBy('u.status')
      .addGroupBy('u.phone')
      .addGroupBy('u.employee_id')
      .addGroupBy('u.reporting_manager')
      .getRawMany();

    return rawUsers.map(user => ({
      id: user.id, // Return ID
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roles: user.roles ? user.roles.split(', ') : [],
      status: user.status,
      phone: user.phone,
      employeeId: user.employeeId,
      reportingManager: user.reportingManager,
    }));
  }

  async getAllTeamMembers(): Promise<TeamMember[]> {
    const rawUsers = await this.usersRepository
      .createQueryBuilder('u')
      .leftJoin('u.roles', 'ur')
      .leftJoin('ur.role', 'r')
      // .where('u.organizationId = :orgId', { orgId }) // Removed filter
      .select([
        'u.id as "id"',
        "CONCAT(u.firstName, ' ', u.lastName) as \"name\"",
        'u.email as "email"',
        "COALESCE(STRING_AGG(DISTINCT r.key, ', '), 'MEMBER') as \"roles\"",
        'u.firstName as "firstName"',
        'u.lastName as "lastName"',
        "u.status as \"status\"",
        'u.phone as "phone"',
        'u.employee_id as "employeeId"',
        'u.reporting_manager as "reportingManager"',
      ])
      .groupBy('u.id')
      .addGroupBy('u.firstName')
      .addGroupBy('u.lastName')
      .addGroupBy('u.email')
      .addGroupBy('u.status')
      .addGroupBy('u.phone')
      .addGroupBy('u.employee_id')
      .addGroupBy('u.reporting_manager')
      .getRawMany();

    return rawUsers.map(user => ({
      id: user.id,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roles: user.roles ? user.roles.split(', ') : [],
      status: user.status,
      phone: user.phone,
      employeeId: user.employeeId,
      reportingManager: user.reportingManager,
    }));
  }


  async findAll(organizationId?: string): Promise<User[]> {
    const whereCondition = organizationId ? { organizationId } : {};
    return this.usersRepository.find({
      where: whereCondition,
      relations: ['roles', 'roles.role'],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        phone: true,
        createdAt: true,
        avatarUrl: true,
      },
      order: { firstName: 'ASC' }
    });
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.role']
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (input.firstName !== undefined) user.firstName = input.firstName;
    if (input.lastName !== undefined) user.lastName = input.lastName;
    if (input.phone !== undefined) user.phone = input.phone;
    if (input.employeeId !== undefined) user.employeeId = input.employeeId;
    if (input.reportingManager !== undefined) user.reportingManager = input.reportingManager;


    await this.usersRepository.save(user);

    // Handle Roles Update
    if (input.roles) {
      const currentRoleKeys = user.roles?.map(ur => ur.role.key) || [];
      const newRoleKeys = input.roles;

      const rolesToAdd = newRoleKeys.filter(key => !currentRoleKeys.includes(key));
      const rolesToRemove = currentRoleKeys.filter(key => !newRoleKeys.includes(key));

      // Remove roles
      if (rolesToRemove.length > 0) {
        for (const roleKey of rolesToRemove) {
          const role = user.roles.find(ur => ur.role.key === roleKey);
          if (role) {
            await this.userRoleRepository.delete({ id: role.id });
          }
        }
      }

      // Add roles
      if (rolesToAdd.length > 0) {
        for (const roleKey of rolesToAdd) {
          const normalizedKey = roleKey.toUpperCase();
          let roleEntity = await this.roleRepository.findOne({ where: { key: normalizedKey } });

          // ✅ DYNAMIC ROLE CREATION
          if (!roleEntity) {
            roleEntity = this.roleRepository.create({
              key: normalizedKey,
              name: normalizedKey.charAt(0) + normalizedKey.slice(1).toLowerCase(),
              isSystemRole: false,
              organizationId: user.organizationId,
            });
            await this.roleRepository.save(roleEntity);
          }

          if (roleEntity) {
            const userRole = this.userRoleRepository.create({
              userId: user.id,
              roleId: roleEntity.id,
              organizationId: user.organizationId, // Keep same org
            });
            await this.userRoleRepository.save(userRole);
          }
        }
      }
    }

    // Return updated user
    return this.findById(id) as Promise<User>;
  }
}
