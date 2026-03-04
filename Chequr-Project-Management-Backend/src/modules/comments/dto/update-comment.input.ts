import { Field, ID, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsString, IsUUID, MinLength } from "class-validator";
import { Transform } from "class-transformer";

@InputType()
export class UpdateCommentInput {
    @Field(() => ID)
    @IsUUID()
    @IsNotEmpty()
    commentId: string;

    @Field()
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => value?.trim())
    @MinLength(1)
    content: string;
}
