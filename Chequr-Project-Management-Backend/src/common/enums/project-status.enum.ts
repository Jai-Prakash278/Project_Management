import { registerEnumType } from '@nestjs/graphql';

export enum projectStatus {
    ACTIVE = 'ACTIVE',
    ARCHIVED = 'ARCHIVED',
    COMPLETED = 'COMPLETED',
    ON_HOLD = 'ON_HOLD',
}

registerEnumType(projectStatus, {
    name: 'ProjectStatus',
});
