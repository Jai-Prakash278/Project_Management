import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class UpdateStageInput {
    @Field(() => ID, { nullable: true })
    id?: string;

    @Field()
    name: string;

    @Field()
    orderIndex: number;

    @Field({ nullable: true })
    isFinal?: boolean;
}

@InputType()
export class UpdateWorkflowStagesInput {
    @Field(() => ID)
    workflowId: string;

    @Field(() => [UpdateStageInput])
    stages: UpdateStageInput[];
}
