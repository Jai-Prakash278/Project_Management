import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsString, IsUUID } from "class-validator";

@InputType()
export class CreateCommentInput {
    @Field()
    @IsUUID()
    @IsNotEmpty()
    issueId: string;

    @Field()
    @IsString()
    @IsNotEmpty()
    content: string;
}
