import { Field, ID, InputType } from "@nestjs/graphql";
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { issuePriority } from "src/common/enums/issue-priority.enum";
import { issueType } from "src/common/enums/issue-type.enum";


@InputType()
export class CreateIssueInput {
    @Field()
    @IsNotEmpty()
    @IsString()
    title: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    description?: string;

    @Field(() => Number, { nullable: true })
    @IsOptional()
    storyPoints?: number;

    @Field({ nullable: true })
    @IsOptional()
    dueDate?: string;

    @Field(() => issueType)
    @IsEnum(issueType)
    type: issueType

    @Field(() => issuePriority, { nullable: true })
    @IsOptional()
    @IsEnum(issuePriority)
    priority: issuePriority

    @Field(() => ID)
    @IsUUID()
    projectId: string;

    @Field(() => ID, { nullable: true })
    @IsOptional()
    @IsUUID()
    assigneeId?: string;

    @Field(() => ID, { nullable: true })
    @IsOptional()
    @IsUUID()
    sprintId?: string;

    @Field(() => ID, { nullable: true })
    @IsOptional()
    @IsUUID()
    parentId?: string;

    @Field(() => ID, { nullable: true })
    @IsOptional()
    @IsUUID()
    stageId?: string;
}