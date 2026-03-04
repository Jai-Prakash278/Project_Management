import { Field, ID, InputType } from "@nestjs/graphql";
import { IsEnum, IsOptional, IsString, IsUUID, ValidateIf } from "class-validator";
import { issuePriority } from "src/common/enums/issue-priority.enum";
import { issueType } from "src/common/enums/issue-type.enum";


@InputType()
export class UpdateIssueInput {
    @Field(() => ID)
    @IsUUID()
    issueId: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    title?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    description?: string;

    @Field(() => issuePriority, { nullable: true })
    @IsOptional()
    @IsEnum(issuePriority)
    priority?: issuePriority;

    @Field(() => ID, { nullable: true })
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @IsUUID()
    assigneeId?: string | null;

    @Field(() => ID, { nullable: true })
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @IsUUID()
    sprintId?: string | null;

    @Field(() => issueType, { nullable: true })
    @IsOptional()
    type?: issueType;

    @Field({ nullable: true })
    @IsOptional()
    storyPoints?: number;

    @Field({ nullable: true })
    @IsOptional()
    dueDate?: Date;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    blockedReason?: string;
}