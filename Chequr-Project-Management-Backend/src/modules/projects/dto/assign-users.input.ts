import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsArray, ArrayNotEmpty } from 'class-validator';

@InputType()
export class AssignUsersInput {
    @Field(() => ID)
    @IsNotEmpty()
    projectId: string;

    @Field(() => [ID])
    @IsArray()
    @ArrayNotEmpty()
    userIds: string[];
}
