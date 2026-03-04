import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Issue } from "../../issues/issue.entity";
import { User } from "../../users/user.entity";

@ObjectType()
@Entity('comments')
export class Comment {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field()
    @Column({ type: 'text' })
    content: string;

    @Field(() => Issue)
    @ManyToOne(() => Issue, (issue) => issue.comments, { onDelete: 'CASCADE' })
    issue: Issue;

    @Field(() => User)
    @ManyToOne(() => User, (user) => user.comments)
    author: User;

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field()
    @UpdateDateColumn()
    updatedAt: Date;
}
