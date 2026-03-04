import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class TeamMember {
  @Field(() => String) // Make sure to import ID if using ID type, but String is safer for UUIDs in some GQL setups
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field()
  email: string;

  @Field(() => [String])
  roles: string[];

  @Field()
  status: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  employeeId?: string;

  @Field({ nullable: true })
  reportingManager?: string;
}

