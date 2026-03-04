import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class updateSprintInput {
  @Field(() => ID)
  sprintId: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  startDate?: Date;

  @Field({ nullable: true })
  endDate?: Date;

  @Field({ nullable: true })
  goal?: string;
}
