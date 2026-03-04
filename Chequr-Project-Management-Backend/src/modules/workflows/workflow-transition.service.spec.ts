import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
    BadRequestException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';

import { WorkflowTransitionService } from './workflow-transition.service';
import { WorkflowTransition } from './workflow-transition.entity';
import { WorkflowStage } from './workflow-stage.entity';
import { Workflow } from './workflow.entity';

// TransitionMode constants (enum removed from workflow.entity.ts post-merge)
const TransitionMode = { SEQUENTIAL: 'SEQUENTIAL', FLEXIBLE: 'FLEXIBLE' } as const;

// ─── Helpers: mock factories ──────────────────────────────────────────────────

const makeStage = (
    id: string,
    orderIndex: number,
    workflowId = 'wf-1',
    isFinal = false,
): WorkflowStage =>
    ({ id, workflowId, orderIndex, isFinal, name: `Stage-${orderIndex}` } as WorkflowStage);

const makeWorkflow = (
    id: string,
    mode: string,
): Workflow => ({ id, transitionMode: mode, name: 'Test Workflow' } as Workflow);

const makeTransition = (
    fromStageId: string,
    toStageId: string,
    allowedRoles: string[] = [],
): WorkflowTransition =>
({
    id: 'tr-1',
    workflowId: 'wf-1',
    fromStageId,
    toStageId,
    allowedRoles,
} as WorkflowTransition);

// ─── Mock Repository Factory ──────────────────────────────────────────────────

const mockRepo = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
});

// ─────────────────────────────────────────────────────────────────────────────

describe('WorkflowTransitionService', () => {
    let service: WorkflowTransitionService;
    let transitionRepo: jest.Mocked<Repository<WorkflowTransition>>;
    let stageRepo: jest.Mocked<Repository<WorkflowStage>>;
    let workflowRepo: jest.Mocked<Repository<Workflow>>;

    const STAGE_TODO = makeStage('stage-todo', 0);
    const STAGE_INPROG = makeStage('stage-inprog', 1);
    const STAGE_BLOCKED = makeStage('stage-blocked', 2);
    const STAGE_INREVIEW = makeStage('stage-inreview', 3);
    const STAGE_DONE = makeStage('stage-done', 4, 'wf-1', true);

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WorkflowTransitionService,
                { provide: getRepositoryToken(WorkflowTransition), useFactory: mockRepo },
                { provide: getRepositoryToken(WorkflowStage), useFactory: mockRepo },
                { provide: getRepositoryToken(Workflow), useFactory: mockRepo },
            ],
        }).compile();

        service = module.get(WorkflowTransitionService);
        transitionRepo = module.get(getRepositoryToken(WorkflowTransition));
        stageRepo = module.get(getRepositoryToken(WorkflowStage));
        workflowRepo = module.get(getRepositoryToken(Workflow));
    });

    afterEach(() => jest.clearAllMocks());

    // =========================================================================
    // SEQUENTIAL MODE TESTS
    // =========================================================================
    describe('Sequential Mode', () => {
        beforeEach(() => {
            // Workflow is set to SEQUENTIAL for all tests in this block
            workflowRepo.findOne.mockResolvedValue(
                makeWorkflow('wf-1', TransitionMode.SEQUENTIAL),
            );
        });

        it('✅ should allow a forward move of exactly 1 step (Todo → InProgress)', async () => {
            stageRepo.findOne
                .mockResolvedValueOnce(STAGE_TODO)    // fromStage
                .mockResolvedValueOnce(STAGE_INPROG); // toStage

            await expect(
                service.validateTransition('user-1', ['DEVELOPER'], 'stage-todo', 'stage-inprog'),
            ).resolves.toBeUndefined();
        });

        it('✅ should allow a backward move of exactly 1 step (InProgress → Todo)', async () => {
            stageRepo.findOne
                .mockResolvedValueOnce(STAGE_INPROG)  // fromStage
                .mockResolvedValueOnce(STAGE_TODO);   // toStage

            await expect(
                service.validateTransition('user-1', ['DEVELOPER'], 'stage-inprog', 'stage-todo'),
            ).resolves.toBeUndefined();
        });

        it('❌ should REJECT skipping a stage forward (Todo → InReview, diff=3)', async () => {
            stageRepo.findOne
                .mockResolvedValueOnce(STAGE_TODO)      // fromStage
                .mockResolvedValueOnce(STAGE_INREVIEW); // toStage

            await expect(
                service.validateTransition('user-1', ['DEVELOPER'], 'stage-todo', 'stage-inreview'),
            ).rejects.toThrow(BadRequestException);
        });

        it('❌ should REJECT skipping to Done directly (Todo → Done, diff=4)', async () => {
            stageRepo.findOne
                .mockResolvedValueOnce(STAGE_TODO)   // fromStage
                .mockResolvedValueOnce(STAGE_DONE);  // toStage

            await expect(
                service.validateTransition('user-1', ['DEVELOPER'], 'stage-todo', 'stage-done'),
            ).rejects.toThrow(BadRequestException);
        });

        it('❌ should REJECT a move of 0 steps (same stage)', async () => {
            stageRepo.findOne
                .mockResolvedValueOnce(STAGE_TODO)  // fromStage
                .mockResolvedValueOnce(STAGE_TODO); // toStage (same!)

            await expect(
                service.validateTransition('user-1', ['DEVELOPER'], 'stage-todo', 'stage-todo'),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // =========================================================================
    // FLEXIBLE MODE TESTS
    // =========================================================================
    describe('Flexible Mode', () => {
        beforeEach(() => {
            workflowRepo.findOne.mockResolvedValue(
                makeWorkflow('wf-1', TransitionMode.FLEXIBLE),
            );
        });

        it('✅ should ALLOW a defined jump transition (Todo → InReview) with correct role', async () => {
            stageRepo.findOne
                .mockResolvedValueOnce(STAGE_TODO)
                .mockResolvedValueOnce(STAGE_INREVIEW);

            transitionRepo.findOne.mockResolvedValue(
                makeTransition('stage-todo', 'stage-inreview', ['PROJECT_MANAGER']),
            );

            await expect(
                service.validateTransition('user-1', ['PROJECT_MANAGER'], 'stage-todo', 'stage-inreview'),
            ).resolves.toBeUndefined();
        });

        it('❌ should REJECT a transition that has no defined rule in flexible mode', async () => {
            stageRepo.findOne
                .mockResolvedValueOnce(STAGE_TODO)
                .mockResolvedValueOnce(STAGE_DONE);

            transitionRepo.findOne.mockResolvedValue(null); // no rule exists

            await expect(
                service.validateTransition('user-1', ['DEVELOPER'], 'stage-todo', 'stage-done'),
            ).rejects.toThrow(BadRequestException);
        });

        it('❌ should REJECT when role is not in allowedRoles', async () => {
            stageRepo.findOne
                .mockResolvedValueOnce(STAGE_TODO)
                .mockResolvedValueOnce(STAGE_INREVIEW);

            // Only PM is allowed, but user is DEVELOPER
            transitionRepo.findOne.mockResolvedValue(
                makeTransition('stage-todo', 'stage-inreview', ['PROJECT_MANAGER']),
            );

            await expect(
                service.validateTransition('user-1', ['DEVELOPER'], 'stage-todo', 'stage-inreview'),
            ).rejects.toThrow(ForbiddenException);
        });

        it('✅ should ALLOW any role when allowedRoles is empty (open transition)', async () => {
            stageRepo.findOne
                .mockResolvedValueOnce(STAGE_INPROG)
                .mockResolvedValueOnce(STAGE_INREVIEW);

            // allowedRoles = [] means no restriction
            transitionRepo.findOne.mockResolvedValue(
                makeTransition('stage-inprog', 'stage-inreview', []),
            );

            await expect(
                service.validateTransition('user-1', ['VIEWER'], 'stage-inprog', 'stage-inreview'),
            ).resolves.toBeUndefined();
        });
    });

    // =========================================================================
    // STAGE NOT FOUND TESTS
    // =========================================================================
    describe('Stage / Workflow Not Found', () => {
        it('❌ should throw NotFoundException when fromStage does not exist', async () => {
            stageRepo.findOne
                .mockResolvedValueOnce(null)        // fromStage missing
                .mockResolvedValueOnce(STAGE_INPROG);

            await expect(
                service.validateTransition('user-1', [], 'bad-id', 'stage-inprog'),
            ).rejects.toThrow(NotFoundException);
        });

        it('❌ should throw NotFoundException when toStage does not exist', async () => {
            stageRepo.findOne
                .mockResolvedValueOnce(STAGE_TODO)  // fromStage OK
                .mockResolvedValueOnce(null);        // toStage missing

            await expect(
                service.validateTransition('user-1', [], 'stage-todo', 'bad-id'),
            ).rejects.toThrow(NotFoundException);
        });

        it('❌ should throw BadRequestException for cross-workflow move', async () => {
            const stageDifferentWorkflow = makeStage('stage-x', 1, 'wf-OTHER');

            stageRepo.findOne
                .mockResolvedValueOnce(STAGE_TODO)           // workflowId = wf-1
                .mockResolvedValueOnce(stageDifferentWorkflow); // workflowId = wf-OTHER

            await expect(
                service.validateTransition('user-1', [], 'stage-todo', 'stage-x'),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // =========================================================================
    // HELPER METHOD TESTS
    // =========================================================================
    describe('getStagesForWorkflow', () => {
        it('should return stages ordered by orderIndex', async () => {
            const stages = [STAGE_TODO, STAGE_INPROG, STAGE_BLOCKED];
            stageRepo.find.mockResolvedValue(stages);

            const result = await service.getStagesForWorkflow('wf-1');

            expect(stageRepo.find).toHaveBeenCalledWith({
                where: { workflowId: 'wf-1' },
                order: { orderIndex: 'ASC' },
            });
            expect(result).toEqual(stages);
        });
    });

    describe('getTransitionsForWorkflow', () => {
        it('should return all transitions for a workflow', async () => {
            const transitions = [makeTransition('stage-todo', 'stage-inreview', ['PM'])];
            transitionRepo.find.mockResolvedValue(transitions);

            const result = await service.getTransitionsForWorkflow('wf-1');

            expect(transitionRepo.find).toHaveBeenCalledWith({
                where: { workflowId: 'wf-1' },
                relations: ['fromStage', 'toStage'],
            });
            expect(result).toEqual(transitions);
        });
    });
});
