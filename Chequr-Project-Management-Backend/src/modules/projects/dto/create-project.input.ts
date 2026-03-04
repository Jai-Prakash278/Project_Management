import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, Length, Matches, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateWorkflowAdvancedInput } from '../../workflows/dto/create-workflow.input';

@InputType()
export class CreateProjectInput {
    @Field()
    @IsNotEmpty()
    @IsString()
    @Length(3, 50)
    name: string;

    @Field()
    @IsNotEmpty()
    @IsString()
    @Length(3, 10)
    @Matches(/^[A-Z0-9]+$/, { message: 'Key must be uppercase alphanumeric' })
    key: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    @Length(0, 500)
    description?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    color?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    icon?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    type?: string;

    @Field(() => CreateWorkflowAdvancedInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    @Type(() => CreateWorkflowAdvancedInput)
    workflow?: CreateWorkflowAdvancedInput;
}