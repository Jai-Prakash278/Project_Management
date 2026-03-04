import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateStageInput {
  @Field()
  name: string;

  @Field()
  orderIndex: number;

  @Field({ nullable: true })
  isFinal?: boolean;
}

@InputType()
export class CreateWorkflowTransitionInput {
  @Field()
  fromStage: string;

  @Field()
  toStage: string;

  @Field(() => [String], { nullable: true })
  allowedRoles?: string[];
}

@InputType()
export class CreateWorkflowAdvancedInput {
  @Field()
  name: string;

  @Field()
  isDefault: boolean;

  @Field({ nullable: true })
  projectId?: string;

  @Field({ nullable: true })
  transitionMode?: string;

  @Field(() => [CreateStageInput], { nullable: true })
  stages?: CreateStageInput[];

  @Field(() => [CreateWorkflowTransitionInput], { nullable: true })
  transitions?: CreateWorkflowTransitionInput[];
}