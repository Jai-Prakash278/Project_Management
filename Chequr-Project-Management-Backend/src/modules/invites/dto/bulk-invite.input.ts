import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class BulkInviteInput {
    @Field()
    email: string;

    @Field(() => [String], { nullable: true })
    roles?: string[];

    @Field({ nullable: true, deprecationReason: 'Use roles instead' })
    role?: string;

    @Field({ nullable: true })
    firstName?: string;

    @Field({ nullable: true })
    lastName?: string;

    @Field({ nullable: true })
    phone?: string;

    @Field({ nullable: true })
    employeeId?: string;
}
