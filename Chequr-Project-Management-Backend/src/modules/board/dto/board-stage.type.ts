import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Issue } from '../../issues/issue.entity';

@ObjectType()
export class BoardStage {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => Int)
  orderIndex: number;

  @Field(() => [Issue])
  issues: Issue[];
}