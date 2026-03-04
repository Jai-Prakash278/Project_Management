import { Field, ID, InputType } from "@nestjs/graphql";
import { IsUUID } from "class-validator";


@InputType()
export class AssignIssueInput {
    @Field(() => ID)
    @IsUUID()
    issueId: string;

    @Field(() => ID)
    @IsUUID()
    assigneeId: string;

    
}