// User structure returned by Backend GraphQL
export interface BackendUser {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    roles: string[];
}

export interface LoginResponse {
    message: string;
    user: BackendUser;
    accessToken: string;
}

// User structure expected by Redux (derived)
export interface User {
    id: string;
    email: string;
    name: string;
    roles: string[];
    initials: string;
}
