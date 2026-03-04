import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Organization } from '../modules/organization/organization.entity';
import { User } from '../modules/users/user.entity';
import { Role } from '../modules/roles/role.entity';
import { UserRole } from '../modules/userRoles/user-role.entity';
import { UserStatus } from '../common/enums/user-status.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const orgRepo = dataSource.getRepository(Organization);
  const userRepo = dataSource.getRepository(User);
  const roleRepo = dataSource.getRepository(Role);
  const userRoleRepo = dataSource.getRepository(UserRole);

  try {
    console.log('🚀 Running seed...');

    /* -------------------------------
       1️⃣ FIND OR CREATE ORGANIZATION
    -------------------------------- */

    let organization = await orgRepo.findOne({
      where: { name: 'Default Organization' },
    });

    if (!organization) {
      organization = orgRepo.create({
        name: 'Default Organization',
      });
      await orgRepo.save(organization);
      console.log('✅ Organization created');
    } else {
      console.log('ℹ️ Organization already exists');
    }

    /* -------------------------------
       2️⃣ FIND OR CREATE ADMIN ROLE
    -------------------------------- */

    let adminRole = await roleRepo.findOne({
      where: {
        key: 'ADMIN',
        organizationId: organization.id,
      },
    });

    if (!adminRole) {
      adminRole = roleRepo.create({
        key: 'ADMIN',
        name: 'Administrator',
        isSystemRole: true,
        organizationId: organization.id,
      });

      await roleRepo.save(adminRole);
      console.log('✅ ADMIN role created');
    } else {
      console.log('ℹ️ ADMIN role already exists');
    }

    /* -------------------------------
       3️⃣ CREATE ADMIN USER (MANUAL)
       👉 Change email & password here
    -------------------------------- */

    const adminEmail = 'jay065117@gmail.com';   // ✏️ Change manually
    const adminPassword = 'Admin123';           // ✏️ Change manually

    const existingUser = await userRepo.findOne({
      where: { email: adminEmail },
    });

    if (existingUser) {
      console.log('⚠️ Admin already exists with this email.');
      return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const adminUser = userRepo.create({
      email: adminEmail,
      passwordHash,
      status: UserStatus.ACTIVE,
      organizationId: organization.id,
    });

    await userRepo.save(adminUser);
    console.log('✅ Admin user created');

    /* -------------------------------
       4️⃣ ASSIGN ADMIN ROLE
    -------------------------------- */

    const userRole = userRoleRepo.create({
      userId: adminUser.id,
      roleId: adminRole.id,
      organizationId: organization.id,
      assignedBy: adminUser.id,
    });

    await userRoleRepo.save(userRole);

    console.log('🎉 Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();



// import 'reflect-metadata';
// import { NestFactory } from '@nestjs/core';
// import { AppModule } from '../app.module';
// import { DataSource } from 'typeorm';
// import * as bcrypt from 'bcrypt';

// import { User } from '../modules/users/user.entity';
// import { Role } from '../modules/roles/role.entity';
// import { UserRole } from '../modules/userRoles/user-role.entity';
// import { UserStatus } from '../common/enums/user-status.enum';

// async function bootstrap() {
//   const app = await NestFactory.createApplicationContext(AppModule);
//   const dataSource = app.get(DataSource);

//   const userRepo = dataSource.getRepository(User);
//   const roleRepo = dataSource.getRepository(Role);
//   const userRoleRepo = dataSource.getRepository(UserRole);

//   try {
//     console.log('🚀 Running SUPER_ADMIN seed...');

//     /* -------------------------------
//        1️⃣ FIND OR CREATE SUPER_ADMIN ROLE (GLOBAL)
//     -------------------------------- */

//     let superAdminRole = await roleRepo.findOne({
//       where: { key: 'SUPER_ADMIN' },
//     });

//     if (!superAdminRole) {
//       superAdminRole = roleRepo.create({
//         key: 'SUPER_ADMIN',
//         name: 'Super Administrator',
//         isSystemRole: true,
//         organizationId: null, // GLOBAL ROLE
//       });

//       await roleRepo.save(superAdminRole);
//       console.log('✅ SUPER_ADMIN role created');
//     } else {
//       console.log('ℹ️ SUPER_ADMIN role already exists');
//     }

//     /* -------------------------------
//        2️⃣ CREATE SUPER_ADMIN USER (MANUAL)
//        👉 Change email & password here
//     -------------------------------- */

//     const superAdminEmail = 'superadmin@gmail.com';  // ✏️ Change manually
//     const superAdminPassword = 'SuperAdmin123';      // ✏️ Change manually

//     const existingUser = await userRepo.findOne({
//       where: { email: superAdminEmail },
//     });

//     if (existingUser) {
//       console.log('⚠️ SUPER_ADMIN already exists with this email.');
//       return;
//     }

//     const passwordHash = await bcrypt.hash(superAdminPassword, 10);

//     const superAdminUser = userRepo.create({
//       email: superAdminEmail,
//       passwordHash,
//       status: UserStatus.ACTIVE,
//       organizationId: null, // GLOBAL USER
//     });

//     await userRepo.save(superAdminUser);
//     console.log('✅ SUPER_ADMIN user created');

//     /* -------------------------------
//        3️⃣ ASSIGN SUPER_ADMIN ROLE
//     -------------------------------- */

//     const userRole = userRoleRepo.create({
//       userId: superAdminUser.id,
//       roleId: superAdminRole.id,
//       organizationId: null, // GLOBAL ASSIGNMENT
//       assignedBy: superAdminUser.id,
//     });

//     await userRoleRepo.save(userRole);

//     console.log('🎉 SUPER_ADMIN seed completed successfully!');
//   } catch (error) {
//     console.error('❌ Seed failed:', error);
//   } finally {
//     await app.close();
//     process.exit(0);
//   }
// }

// bootstrap();
