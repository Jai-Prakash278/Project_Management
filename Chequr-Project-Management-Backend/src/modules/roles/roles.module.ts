import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from './role.entity';
import { Organization } from '../organization/organization.entity';
import { OrganizationModule } from '../organization/organization.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role]), // Register Role entity
    OrganizationModule,               // So Role can find Organization
  ],
  providers: [],
  exports: [TypeOrmModule], // optional, if other modules use Role entity
})
export class RolesModule { }
