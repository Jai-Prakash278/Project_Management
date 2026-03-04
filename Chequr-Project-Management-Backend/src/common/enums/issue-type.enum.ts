import { registerEnumType } from "@nestjs/graphql";

export enum issueType {
    EPIC = 'EPIC',
    STORY = 'STORY',
    TASK = 'TASK',
    BUG = 'BUG',
    SUBTASK = 'SUBTASK'
}

registerEnumType(issueType, {
    name : 'issueType',
})