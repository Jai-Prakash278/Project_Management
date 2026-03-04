import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardService } from './board.service';
import { BoardResolver } from './board.resolver';
import { Issue } from '../issues/issue.entity';
import { WorkflowsModule } from '../workflows/workflows.module';
import { UsersModule } from '../users/users.module';

// ─── BoardModule ──────────────────────────────────────────────────────────────
// WorkflowsModule → provides WorkflowTransitionService (Squad 3 validation engine)
// UsersModule     → provides UsersService to load user roles for role checks
@Module({
    imports: [
        TypeOrmModule.forFeature([Issue]),
        WorkflowsModule,   // ← Squad 3: includes WorkflowTransitionService
        UsersModule,       // ← needed to load user roles for role-based checks
    ],
    providers: [BoardService, BoardResolver],
    exports: [BoardService],
})
export class BoardModule { }