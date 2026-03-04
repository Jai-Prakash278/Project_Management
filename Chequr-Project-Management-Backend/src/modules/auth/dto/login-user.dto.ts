import { Field, ID, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class LoginUser {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field(() => [String])
  roles: string[];

  @Field({ nullable: true })
  phone?: string;
}