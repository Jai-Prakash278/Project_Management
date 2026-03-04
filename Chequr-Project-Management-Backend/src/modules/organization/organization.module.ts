import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './organization.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Organization])],
  exports: [TypeOrmModule], // allows other modules to use Organization entity
})
export class OrganizationModule {}