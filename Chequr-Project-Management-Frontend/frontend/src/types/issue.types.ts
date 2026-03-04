export enum IssueType {
    EPIC = 'EPIC',
    STORY = 'STORY',
    TASK = 'TASK',
    BUG = 'BUG',
    SUBTASK = 'SUBTASK',
}


export enum WorkflowMode {
    SEQUENTIAL = 'SEQUENTIAL',
    FLEXIBLE = 'FLEXIBLE',
}

export interface Stage {
    id: string;
    name: string;
    orderIndex: number;
}

export interface Transition {
    fromStageId: string;
    toStageId: string;
    allowedRoles: string[];
}

export interface Workflow {
    id: string;
    transitionMode: WorkflowMode;
}

export enum IssuePriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
}

export interface User {
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    avatarUrl?: string;
}

export interface WorkflowStage {
    id: string;
    name: string;
    orderIndex: number;
    category?: 'TODO' | 'IN_PROGRESS' | 'DONE';
    isFinal?: boolean;
}

export interface Subtask {
    id: string;
    title: string;
    completed: boolean;
}


export interface Issue {
    blockedReason?: string;
    id: string;
    title: string;
    description?: string;
    stageId: string;
    stage?: WorkflowStage;
    priority: IssuePriority;
    type: IssueType;
    storyPoints?: number;
    dueDate?: string; // ISO Date string
    boardOrder?: number;

    // Relations
    assignee?: User;
    reporter: User;
    project: {
        workflow: any;
        id: string;
        name: string;
        key?: string; // Add key here as it's used
    };
    sprint?: {
        id: string;
        name: string;
    };
    sprintId?: string;

    parentId?: string;
    parent?: {
        id: string;
        title: string;
    };

    subtaskList?: Subtask[];

    createdAt: string;
    updatedAt: string;

    comments?: Comment[];
    attachments?: Attachment[];
}

export interface Attachment {
    id: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    base64: string; // Thumbnail base64
    createdAt: string;
    uploadedBy: User;
}

export interface Comment {
    id: string;
    content: string;
    createdAt: string;
    author: User;
}

export type IssueTab = 'assigned' | 'reported';
