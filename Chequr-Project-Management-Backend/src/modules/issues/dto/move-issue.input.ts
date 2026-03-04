import { Field, ID, InputType, Float, Int } from "@nestjs/graphql";
import { IsNumber, IsOptional, IsUUID } from "class-validator";

@InputType()
export class MoveIssueInput {
    @Field(() => ID)
    @IsUUID()
    issueId: string;

    @Field(() => ID)
    @IsUUID()
    stageId: string;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    boardOrder?: number;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    position?: number;
}
