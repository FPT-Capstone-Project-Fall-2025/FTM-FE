import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type FeatureCode = 'EVENT' | 'FUND' | 'MEMBER' | 'HONOR';
export type PermissionMethod = 'VIEW' | 'ADD' | 'UPDATE' | 'DELETE';

export interface FeaturePermissions {
    EVENT?: PermissionMethod[];
    FUND?: PermissionMethod[];
    MEMBER?: PermissionMethod[];
    HONOR?: PermissionMethod[];
    isOwner?: boolean; // Whether the user is the owner of the family tree
}

interface PermissionState {
    // Permissions indexed by family tree ID
    permissions: {
        [ftId: string]: FeaturePermissions;
    };
    isLoading: boolean;
    error: string | null;
}

const initialState: PermissionState = {
    permissions: {},
    isLoading: true,
    error: null,
};

const permissionSlice = createSlice({
    name: 'permissions',
    initialState,
    reducers: {
        setPermissions: (
            state,
            action: PayloadAction<{ ftId: string; permissions: FeaturePermissions }>
        ) => {
            state.permissions[action.payload.ftId] = action.payload.permissions;
            state.isLoading = false;
            state.error = null;
        },
        clearPermissions: (state, action: PayloadAction<string>) => {
            delete state.permissions[action.payload];
        },
        clearAllPermissions: (state) => {
            state.permissions = {};
            state.error = null;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
            state.isLoading = false;
        },
    },
});

export const {
    setPermissions,
    clearPermissions,
    clearAllPermissions,
    setLoading,
    setError,
} = permissionSlice.actions;

export default permissionSlice.reducer;
