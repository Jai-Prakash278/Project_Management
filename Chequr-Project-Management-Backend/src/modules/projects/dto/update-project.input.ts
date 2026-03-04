import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsString, Length, IsOptional } from 'class-validator';
import { projectStatus } from '../../../common/enums/project-status.enum';

@InputType()
export class UpdateProjectInput {
    @Field(() => ID)
    @IsNotEmpty()
    id: string;

    @Field({ nullable: true })
    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    @Length(3, 50)
    name?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
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

    @Field(() => projectStatus, { nullable: true })
    @IsOptional()
    status?: projectStatus;
}
