import { registerEnumType } from "@nestjs/graphql";

export enum issuePriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH'
}

registerEnumType(issuePriority, {
    name : 'issuePriority'
})