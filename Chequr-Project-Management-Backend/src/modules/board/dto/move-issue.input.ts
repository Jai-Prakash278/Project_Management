import { InputType, Field, ID } from '@nestjs/graphql';
import { IsOptional, IsNumber, IsUUID } from 'class-validator';

@InputType()
export class MoveIssueInput {
    // The issue being moved
    @Field(() => ID)
    @IsUUID()
    issueId: string;

    @Field(() => ID)
    @IsUUID()
    stageId: string;

    @Field(() => Number, { nullable: true })
    @IsOptional()
    @IsNumber()
    position?: number;
}
