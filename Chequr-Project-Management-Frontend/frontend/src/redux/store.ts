import { configureStore, combineReducers, Action } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

const appReducer = combineReducers({
    auth: authReducer,
});

const rootReducer = (state: any, action: Action) => {
    if (action.type === 'auth/logout') {
        state = undefined;
    }
    return appReducer(state, action);
};

export const store = configureStore({
    reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
