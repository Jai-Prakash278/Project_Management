import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../users/user.entity";
import { Project } from "../projects/project.entity";
import { Issue, Subtask } from "./issue.entity";
import { Sprint } from "../sprints/sprint.entity";
import { CreateIssueInput } from "./dto/create-issue.input";
import { UpdateIssueInput } from "./dto/update-issue.input";
import { AssignIssueInput } from "./dto/assign-issue.input";
import { MoveIssueInput } from "./dto/move-issue.input";
import { WorkflowStage } from "../workflows/workflow-stage.entity";
import { IssueValidation } from "./validations/issue.validation";
import { issuePriority } from "src/common/enums/issue-priority.enum";

@Injectable()
export class IssueService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(Project)
        private readonly projectRepo: Repository<Project>,

        @InjectRepository(Issue)
        private readonly issueRepo: Repository<Issue>,

        @InjectRepository(Subtask)
        private readonly subtaskRepo: Repository<Subtask>,

        @InjectRepository(Sprint)
        private readonly sprintRepo: Repository<Sprint>,

        @InjectRepository(WorkflowStage)
        private readonly stageRepo: Repository<WorkflowStage>,
    ) { }

    // ===================================================
    // ✅ CREATE ISSUE — auto-assigns first workflow stage
    // ===================================================
    async createIssue(input: CreateIssueInput, currentUser: User): Promise<Issue> {
        const project = await this.projectRepo.findOne({
            where: { id: input.projectId },
            relations: ["members"],
        });

        if (!project) throw new NotFoundException("Project not found");

        IssueValidation.validateProjectMembership(project, currentUser);

        if (!project.workflowId) {
            throw new Error("Project has no workflow assigned");
        }

        // 🔹 Determine stage: use provided stageId or fall back to first stage (orderIndex=0)
        let targetStage: WorkflowStage | null = null;

        if (input.stageId) {
            targetStage = await this.stageRepo.findOne({
                where: { id: input.stageId, workflowId: project.workflowId },
            });
            if (!targetStage) {
                throw new NotFoundException("Specified stage not found in this project's workflow");
            }
        } else {
            targetStage = await this.stageRepo.findOne({
                where: { workflowId: project.workflowId, orderIndex: 0 },
            });
            if (!targetStage) {
                throw new Error("No stages found in workflow — project may be corrupted");
            }
        }

        // 🔹 Get next board order within the target stage
        const maxOrder = await this.issueRepo
            .createQueryBuilder("issue")
            .where("issue.stageId = :stageId", { stageId: targetStage!.id })
            .select("MAX(issue.boardOrder)", "max")
            .getRawOne();

        const nextOrder = (maxOrder?.max ?? -1) + 1;

        // 🔹 Optionally attach sprint
        let sprint: Sprint | null = null;
        if (input.sprintId) {
            sprint = await this.sprintRepo.findOne({ where: { id: input.sprintId } });
        }

        // 🔹 Optionally attach assignee
        let assignee: User | null = null;
        if (input.assigneeId) {
            assignee = await this.userRepo.findOne({ where: { id: input.assigneeId } });
        }

        const issue = this.issueRepo.create({
            title: input.title,
            description: input.description,
            type: input.type,
            priority: input.priority ?? issuePriority.MEDIUM,
            storyPoints: input.storyPoints,
            dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
            reporter: currentUser,
            project,
            stageId: targetStage!.id,
            boardOrder: nextOrder,
            sprint,
            assignee,
        });

        return this.issueRepo.save(issue);
    }

    // ===================================================
    // ✅ UPDATE ISSUE
    // ===================================================
    async updateIssue(input: UpdateIssueInput, currentUser: User): Promise<Issue> {
        const issue = await this.issueRepo.findOne({
            where: { id: input.issueId },
            relations: ["project", "project.members", "reporter", "assignee", "stage"],
        });

        if (!issue) throw new NotFoundException("Issue not found");

        // Any member of the project can update issues in that project
        IssueValidation.validateAssignmentPermission(issue.project, currentUser);

        if (input.title !== undefined) issue.title = input.title;
        if (input.description !== undefined) issue.description = input.description;
        if (input.priority !== undefined) issue.priority = input.priority;
        if (input.type !== undefined) issue.type = input.type;
        if (input.storyPoints !== undefined) issue.storyPoints = input.storyPoints;
        if (input.dueDate !== undefined) issue.dueDate = input.dueDate;
        if (input.blockedReason !== undefined) issue.blockedReason = input.blockedReason;

        // Handle sprint change
        if (input.sprintId !== undefined) {
            if (input.sprintId === null) {
                issue.sprint = null;
            } else {
                const sprint = await this.sprintRepo.findOne({ where: { id: input.sprintId } });
                if (!sprint) throw new NotFoundException("Sprint not found");
                issue.sprint = sprint;
            }
        }

        // Handle assignee change
        if (input.assigneeId !== undefined) {
            if (input.assigneeId === null) {
                issue.assignee = null;
            } else {
                const assignee = await this.userRepo.findOne({ where: { id: input.assigneeId } });
                if (!assignee) throw new NotFoundException("Assignee not found");
                issue.assignee = assignee;
            }
        }

        return this.issueRepo.save(issue);
    }

    // ===================================================
    // ✅ ASSIGN ISSUE
    // ===================================================
    async assignIssue(input: AssignIssueInput, currentUser: User): Promise<Issue> {
        const issue = await this.issueRepo.findOne({
            where: { id: input.issueId },
            relations: ["project", "project.members", "reporter", "assignee", "stage"],
        });

        if (!issue) throw new NotFoundException("Issue not found");

        IssueValidation.validateAssignmentPermission(issue.project, currentUser);

        const assignee = await this.userRepo.findOne({ where: { id: input.assigneeId } });
        if (!assignee) throw new NotFoundException("Assignee user not found");

        issue.assignee = assignee;
        return this.issueRepo.save(issue);
    }

    // ===================================================
    // ✅ DELETE ISSUE
    // ===================================================
    async deleteIssue(id: string, currentUser: User): Promise<boolean> {
        const issue = await this.issueRepo.findOne({
            where: { id },
            relations: ["reporter"],
        });

        if (!issue) throw new NotFoundException("Issue not found");

        IssueValidation.validateDeletePermission(issue, currentUser);

        await this.issueRepo.remove(issue);
        return true;
    }

    // ===================================================
    // ✅ MOVE ISSUE (stage change + board reorder)
    // ===================================================
    async moveIssue(input: MoveIssueInput, currentUser: User): Promise<Issue> {
        const issue = await this.issueRepo.findOne({
            where: { id: input.issueId },
            relations: ["project", "reporter", "stage"],
        });

        if (!issue) throw new NotFoundException("Issue not found");

        IssueValidation.validateUpdatePermission(issue, currentUser);

        // Verify stage exists
        const stage = await this.stageRepo.findOne({ where: { id: input.stageId } });
        if (!stage) throw new NotFoundException("Workflow stage not found");

        // 🔹 If no position provided, place at bottom of target stage
        if (input.position !== undefined) {
            issue.boardOrder = input.position;
        } else {
            const maxOrder = await this.issueRepo
                .createQueryBuilder("issue")
                .where("issue.stageId = :stageId", { stageId: input.stageId })
                .select("MAX(issue.boardOrder)", "max")
                .getRawOne();
            issue.boardOrder = (maxOrder?.max ?? -1) + 1;
        }

        issue.stageId = input.stageId;
        issue.stage = stage;

        return this.issueRepo.save(issue);
    }

    // ===================================================
    // ✅ GET BOARD ISSUES (ordered by boardOrder)
    // ===================================================
    async getBoardIssues(projectId: string, sprintId?: string): Promise<Issue[]> {
        const where: any = { project: { id: projectId } };

        if (sprintId && sprintId !== "all") {
            where.sprint = { id: sprintId };
        }

        return this.issueRepo.find({
            where,
            relations: ["project", "reporter", "assignee", "sprint", "stage"],
            order: { boardOrder: "ASC" },
        });
    }

    // ===================================================
    // ✅ GET ISSUE BY ID
    // ===================================================
    async getIssueById(id: string): Promise<Issue> {
        const issue = await this.issueRepo.findOne({
            where: { id },
            relations: ["project", "reporter", "assignee", "sprint", "stage", "subtaskList", "comments", "attachments", "parent", "childIssues"],
        });

        if (!issue) throw new NotFoundException("Issue not found");
        return issue;
    }

    // ===================================================
    // ✅ GET ISSUES BY PROJECT
    // ===================================================
    async getIssuesByProject(projectId: string): Promise<Issue[]> {
        return this.issueRepo.find({
            where: { project: { id: projectId } },
            relations: ["reporter", "assignee", "sprint", "stage"],
            order: { createdAt: "DESC" },
        });
    }

    // ===================================================
    // ✅ GET MY ISSUES
    // ===================================================
    async getMyIssues(userId: string, filter?: string): Promise<Issue[]> {
        const where: any[] = [
            { reporter: { id: userId } },
            { assignee: { id: userId } },
        ];

        const issues = await this.issueRepo.find({
            where,
            relations: ["project", "project.workflow", "project.workflow.stages", "reporter", "assignee", "sprint", "stage", "subtaskList"],
            order: { updatedAt: "DESC" },
        });

        const normalizedFilter = filter?.toLowerCase();

        if (normalizedFilter === "reporter" || normalizedFilter === "reported") {
            return issues.filter(i => i.reporter?.id === userId);
        }
        if (normalizedFilter === "assignee" || normalizedFilter === "assigned") {
            return issues.filter(i => i.assignee?.id === userId);
        }

        return issues;
    }

    // ===================================================
    // ✅ SUBTASK OPERATIONS
    // ===================================================
    async addSubtask(issueId: string, title: string): Promise<Subtask> {
        const issue = await this.issueRepo.findOne({ where: { id: issueId } });
        if (!issue) throw new NotFoundException("Issue not found");

        const subtask = this.subtaskRepo.create({ title, issue, completed: false });
        return this.subtaskRepo.save(subtask);
    }

    async toggleSubtask(subtaskId: string): Promise<Subtask> {
        const subtask = await this.subtaskRepo.findOne({ where: { id: subtaskId } });
        if (!subtask) throw new NotFoundException("Subtask not found");

        subtask.completed = !subtask.completed;
        return this.subtaskRepo.save(subtask);
    }

    async deleteSubtask(subtaskId: string): Promise<boolean> {
        const result = await this.subtaskRepo.delete(subtaskId);
        return (result.affected ?? 0) > 0;
    }

    // ===================================================
    // ✅ CHECK OVERDUE ISSUES (called by scheduler)
    // Returns count of overdue non-final-stage issues
    // ===================================================
    async checkOverdueIssues(): Promise<number> {
        const now = new Date();
        const overdueIssues = await this.issueRepo
            .createQueryBuilder('issue')
            .innerJoin('workflow_stages', 'ws', 'ws.id = issue."stageId"')
            .where('issue."dueDate" < :now', { now })
            .andWhere('ws."isFinal" = false')
            .getMany();

        return overdueIssues.length;
    }

    // ===================================================
    // ✅ GET STAGE FOR ISSUE (Field Resolver Helper)
    // ===================================================
    async getStageForIssue(stageId: string): Promise<WorkflowStage | null> {
        if (!stageId) return null;

        const stage = await this.stageRepo.findOne({ where: { id: stageId } });
        if (!stage) return null;

        // ✅ Early return: stage is already marked as final — all good
        if (stage.isFinal) return stage;

        // 🔍 Fallback for legacy flexible workflow data:
        // If NO stage in this workflow has isFinal=true (old custom workflows created without isFinal),
        // treat the stage with the highest orderIndex as the de-facto final stage.
        const allStages = await this.stageRepo.find({
            where: { workflowId: stage.workflowId },
            order: { orderIndex: 'DESC' },
        });

        const hasAnyFinalStage = allStages.some((s) => s.isFinal);
        if (!hasAnyFinalStage && allStages.length > 0) {
            // The stage with the highest orderIndex is the final stage
            const lastStage = allStages[0]; // allStages sorted DESC, so [0] is highest
            if (lastStage.id === stage.id) {
                // Return the current stage with isFinal overridden to true (no DB write needed)
                return { ...stage, isFinal: true };
            }
        }

        return stage;
    }

    // ===================================================
    // ✅ GET SPRINT FOR ISSUE (Field Resolver Helper)
    // ===================================================
    async getSprintForIssue(sprintId: string): Promise<Sprint | null> {
        if (!sprintId) return null;
        return this.sprintRepo.findOne({ where: { id: sprintId } });
    }
}