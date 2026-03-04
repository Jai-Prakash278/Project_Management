import { InputType, Field, GraphQLISODateTime } from '@nestjs/graphql';
import { Column } from 'typeorm';

@InputType()
export class createSprintInput {
  @Field()
  name: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  startDate?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  endDate?: Date;


  @Field({ nullable: true })
  goal?: string;


  @Field()
  projectId: string;
}
