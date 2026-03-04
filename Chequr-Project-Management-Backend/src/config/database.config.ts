import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (databaseUrl: string): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: databaseUrl,
  autoLoadEntities: true,
  synchronize: process.env.NODE_ENV !== 'production',
  ssl: {
    rejectUnauthorized: false,
  },
  extra: {
    max: 10,
  },
});
