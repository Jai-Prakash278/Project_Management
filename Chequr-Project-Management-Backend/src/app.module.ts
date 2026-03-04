import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AppResolver } from './app.resolver';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { InvitesModule } from './modules/invites/invites.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { IssueModule } from './modules/issues/issue.module';
import { SprintModule } from './modules/sprints/sprint.module';
import { BoardModule } from './modules/board/board.module';
import { CommentsModule } from './modules/comments/comments.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { ScheduleModule } from '@nestjs/schedule';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        databaseConfig(config.get<string>('DATABASE_URL')!),
    }),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'schema.gql'),
      playground: {
        settings: {
          'schema.polling.enable': false,
        },
      },
      context: ({ req, res }) => ({ req, res }),
    }),

    AuthModule,
    RolesModule,
    InvitesModule,
    UsersModule,
    ProjectsModule,
    OrganizationModule,
    IssueModule,
    SprintModule,
    BoardModule,
    CommentsModule,
    AttachmentsModule,
    WorkflowsModule,
  ],
  controllers: [AppController],
  providers: [AppResolver],
})
export class AppModule { }