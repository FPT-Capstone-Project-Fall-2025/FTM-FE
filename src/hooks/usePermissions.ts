import { useAppSelector } from './redux';
import type { FeatureCode, PermissionMethod, FeaturePermissions } from '@/stores/slices/permissionSlice';
import {
    hasPermission as checkPermission,
    getFeaturePermissions as getPermissions,
    canView as checkCanView,
    canAdd as checkCanAdd,
    canUpdate as checkCanUpdate,
    canDelete as checkCanDelete,
    formatPermissionsForLogging,
} from '@/utils/permissionUtils';

/**
 * Custom hook to access and check permissions for a family tree
 * @param ftId - Family tree ID (optional, uses selected tree if not provided)
 * @returns Permission checking utilities
 */
export function usePermissions(ftId?: string) {
    const selectedTree = useAppSelector(state => state.familyTreeMetaData.selectedFamilyTree);
    const permissionsState = useAppSelector(state => state.permissions);

    // Use provided ftId or fall back to selected tree
    const treeId = ftId || selectedTree?.id;

    // Get permissions for the specified or selected family tree
    const permissions: FeaturePermissions = treeId
        ? permissionsState.permissions[treeId] || {}
        : {};

    /**
     * Check if user has a specific permission for a feature
     */
    const hasPermission = (feature: FeatureCode, method: PermissionMethod): boolean => {
        return checkPermission(permissions, feature, method);
    };

    /**
     * Get all permissions for a specific feature
     */
    const getFeaturePermissions = (feature: FeatureCode): PermissionMethod[] => {
        return getPermissions(permissions, feature);
    };

    /**
     * Check if user can view a feature
     */
    const canView = (feature: FeatureCode): boolean => {
        return checkCanView(permissions, feature);
    };

    /**
     * Check if user can add to a feature
     */
    const canAdd = (feature: FeatureCode): boolean => {
        return checkCanAdd(permissions, feature);
    };

    /**
     * Check if user can update a feature
     */
    const canUpdate = (feature: FeatureCode): boolean => {
        return checkCanUpdate(permissions, feature);
    };

    /**
     * Check if user can delete from a feature
     */
    const canDelete = (feature: FeatureCode): boolean => {
        return checkCanDelete(permissions, feature);
    };

    /**
     * Log permissions for a feature to console (for debugging)
     */
    const logPermissions = (feature: FeatureCode): void => {
        const logMessage = formatPermissionsForLogging(permissions, feature);
        console.log(logMessage);
    };

    return {
        permissions,
        isLoading: permissionsState.isLoading,
        error: permissionsState.error,
        hasPermission,
        getFeaturePermissions,
        canView,
        canAdd,
        canUpdate,
        canDelete,
        logPermissions,
    };
}
