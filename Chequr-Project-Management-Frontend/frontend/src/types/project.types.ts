export interface User {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    avatarUrl?: string;
}

export interface Project {
    id: string;
    name: string;
    key: string;
    description?: string;
    status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
    owner: User;
    members: User[];
    // New fields
    color?: string;
    icon: any;
    type?: string;
    // issues: Issue[]; // Uncomment when Issue type is available
    createdAt: string;
    updatedAt: string;
    workflow?: {
        id: string;
        name?: string;
        isDefault: boolean;
        transitionMode: 'SEQUENTIAL' | 'FLEXIBLE' | string;
        stages: {
            id: string;
            name: string;
            orderIndex: number;
            isFinal?: boolean;
        }[];
    };

    // Frontend specific mapped fields
    tag?: string;
    tagType?: string;
    // Issues count
    issues?: number;
    createdBy?: string;
    title?: string; // Alias for name
}


export interface CreateProjectInput {
    name: string;
    key: string;
    description?: string;
    color?: string;
    icon?: string;
    type?: string;
}

export interface UpdateProjectInput {
    id: string;
    name?: string;
    description?: string;
    status?: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
    color?: string;
    icon?: string;
    type?: string;
}

export interface AssignUsersInput {
    projectId: string;
    userIds: string[];
}
