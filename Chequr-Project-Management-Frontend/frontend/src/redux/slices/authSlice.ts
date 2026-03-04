import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    roles: string[];
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isInitializing: boolean;
    loading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isInitializing: true,
    loading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        setToken: (state, action: PayloadAction<string>) => {
            state.token = action.payload;
            state.isAuthenticated = true;
        },
        loginSuccess: (state, action: PayloadAction<{ user: User; token?: string }>) => {
            state.loading = false;
            state.isAuthenticated = true;
            state.user = action.payload.user;

            if (action.payload.token) {
                state.token = action.payload.token;
            }
        },
        loginFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
        },
        setInitializing: (state, action: PayloadAction<boolean>) => {
            state.isInitializing = action.payload;
        }
    },
});

export const { loginStart, setToken, loginSuccess, loginFailure, logout, setInitializing } = authSlice.actions;

export default authSlice.reducer;
