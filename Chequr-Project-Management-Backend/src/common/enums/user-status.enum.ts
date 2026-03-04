import { registerEnumType } from '@nestjs/graphql';

export enum UserStatus {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
    PENDING = 'PENDING', 
}

registerEnumType(UserStatus, { name: 'UserStatus' });
