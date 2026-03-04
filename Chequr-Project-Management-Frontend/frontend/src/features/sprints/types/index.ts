export enum SprintStatus {
    PLANNED = 'PLANNED',
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
}

export interface Issue {
    id: string;
    title: string;
    stageId: string;
    stage?: {
        id: string;
        name: string;
        isFinal: boolean;
    };
    type?: 'BUG' | 'TASK' | 'STORY';
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
    assignee?: {
        id: string;
        firstName: string;
        lastName: string;
        username?: string;
        avatarUrl?: string;
    };
    reporter?: {
        id: string;
        firstName: string;
        lastName: string;
        username?: string;
        avatarUrl?: string;
    };
    description?: string;
    sprintId?: string;
    createdAt?: string;
    updatedAt?: string;
    sprint?: {
        id: string;
        name: string;
    };
}

export interface Sprint {
    id: string;
    name: string;
    startDate?: string; // ISO Date string
    endDate?: string;   // ISO Date string
    status: SprintStatus;
    projectId: string;
    issues?: Issue[];
    createdAt: string;
    updatedAt: string;
    goal?: string;
}

export interface CreateSprintInput {
    projectId: string;
}

export interface StartSprintInput {
    startDate: string;
    endDate: string;
    goal?: string;
}

export interface CompleteSprintInput {
    moveIssuesToSprintId?: string; // invalid or specific sprint ID
}
