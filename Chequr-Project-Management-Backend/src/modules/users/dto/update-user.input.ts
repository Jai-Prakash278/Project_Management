import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, Length } from 'class-validator';

@InputType()
export class UpdateUserInput {
    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    @Length(2, 50)
    firstName?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    @Length(2, 50)
    lastName?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    phone?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    employeeId?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    reportingManager?: string;

    @Field(() => [String], { nullable: true })
    @IsOptional()
    roles?: string[];
}
