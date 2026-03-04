import { JwtModuleOptions } from '@nestjs/jwt';
import { StringValue } from 'ms';

export const jwtConfig = (): JwtModuleOptions => ({
  secret: process.env.JWT_SECRET!,
  signOptions: {
    expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as StringValue,
  },
});
