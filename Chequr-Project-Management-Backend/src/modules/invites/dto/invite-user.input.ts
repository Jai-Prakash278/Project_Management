import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';

@InputType()
export class InviteUserInput {
    @Field()
    email: string;

    @Field()
    firstName: string;

    @Field()
    lastName: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    phone?: string;

    @Field(() => [String])
    roles: string[];

    @Field({ nullable: true })
    managerId?: string;

    @Field({ nullable: true })
    employeeId?: string;

    @Field({ nullable: true })
    reportingManager?: string;
}
