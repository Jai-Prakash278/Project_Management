import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CompleteRegistrationInput {
  @Field()
  token: string;

  @Field()
  password: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;
}
