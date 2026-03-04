import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class startSprintInput {
  @Field(() => ID)
  sprintId: string;

  @Field()
  startDate: Date;

  @Field()
  endDate: Date;

  @Field()
  goal: string;
}
