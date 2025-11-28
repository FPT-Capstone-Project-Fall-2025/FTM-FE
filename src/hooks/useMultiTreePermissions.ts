import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import type { FeatureCode, PermissionMethod, FeaturePermissions } from '@/stores/slices/permissionSlice';
import { setPermissions, setLoading, setError } from '@/stores/slices/permissionSlice';
import {
    hasPermission as checkPermission,
    canView as checkCanView,
    canAdd as checkCanAdd,
    canUpdate as checkCanUpdate,
    canDelete as checkCanDelete,
    extractUserPermissions,
} from '@/utils/permissionUtils';
import ftauthorizationService from '@/services/familyTreeAuth';
import { getUserIdFromToken } from '@/utils/jwtUtils';

export interface FamilyTreePermissions {
    ftId: string;
    permissions: FeaturePermissions;
    isLoading: boolean;
    error: string | null;
    hasPermission: (feature: FeatureCode, method: PermissionMethod) => boolean;
    canView: (feature: FeatureCode) => boolean;
    canAdd: (feature: FeatureCode) => boolean;
    canUpdate: (feature: FeatureCode) => boolean;
    canDelete: (feature: FeatureCode) => boolean;
}

/**
 * Custom hook to load and check permissions for multiple family trees
 * @param familyTreeIds - Array of family tree IDs to load permissions for
 * @returns Array of family tree permissions with helper methods
 */
export function useMultiTreePermissions(familyTreeIds: string[]): FamilyTreePermissions[] {
    const dispatch = useAppDispatch();
    const permissionsState = useAppSelector(state => state.permissions);
    const auth = useAppSelector(state => state.auth);

    // Fetch permissions for all family trees
    useEffect(() => {
        const fetchAllPermissions = async () => {
            if (familyTreeIds.length === 0 || !auth.token) return;

            dispatch(setLoading(true));

            try {
                const userId = getUserIdFromToken(auth.token);

                // Fetch permissions for each family tree
                const permissionPromises = familyTreeIds.map(async (ftId) => {
                    try {
                        const response = await ftauthorizationService.getFTAuthsWithOwner(ftId, {
                            pageIndex: 0,
                            pageSize: 10000,
                            propertyFilters: [
                                { "name": "FtId", "operation": "EQUAL", "value": ftId },
                                { "name": "AuthorizedMember.UserId", "operation": "NOTEQUAL", "value": null },
                                { "name": "AuthorizedMember.UserId", "operation": "EQUAL", "value": userId }
                            ],
                            totalItems: 0,
                            totalPages: 0
                        });

                        const userPermissions = extractUserPermissions(response.data.data);

                        dispatch(setPermissions({
                            ftId,
                            permissions: userPermissions
                        }));

                        console.log(`✅ Loaded permissions for FT: ${ftId}`, userPermissions);

                        return { ftId, success: true };
                    } catch (error) {
                        console.error(`❌ Error fetching permissions for FT ${ftId}:`, error);
                        return { ftId, success: false };
                    }
                });

                await Promise.all(permissionPromises);
            } catch (error) {
                console.error('Error fetching permissions:', error);
                dispatch(setError('Failed to load permissions'));
            }
        };

        fetchAllPermissions();
    }, [familyTreeIds.join(','), auth.token, dispatch]); // Use join to create stable dependency

    // Return permissions for all family trees
    return useMemo(() => {
        return familyTreeIds.map(ftId => {
            // Get permissions for this specific family tree
            const permissions = permissionsState.permissions[ftId] || {};

            // Create helper methods for this family tree
            const hasPermission = (feature: FeatureCode, method: PermissionMethod): boolean => {
                return checkPermission(permissions, feature, method);
            };

            const canView = (feature: FeatureCode): boolean => {
                return checkCanView(permissions, feature);
            };

            const canAdd = (feature: FeatureCode): boolean => {
                return checkCanAdd(permissions, feature);
            };

            const canUpdate = (feature: FeatureCode): boolean => {
                return checkCanUpdate(permissions, feature);
            };

            const canDelete = (feature: FeatureCode): boolean => {
                return checkCanDelete(permissions, feature);
            };

            return {
                ftId,
                permissions,
                isLoading: permissionsState.isLoading,
                error: permissionsState.error,
                hasPermission,
                canView,
                canAdd,
                canUpdate,
                canDelete,
            };
        });
    }, [familyTreeIds, permissionsState]);
}

/**
 * Helper to check if user can perform an action on ANY of the provided family trees
 * @param treePermissions - Array of family tree permissions
 * @param feature - Feature code to check
 * @param method - Permission method to check
 * @returns true if user has permission in at least one family tree
 */
export function canPerformInAnyTree(
    treePermissions: FamilyTreePermissions[],
    feature: FeatureCode,
    method: PermissionMethod
): boolean {
    return treePermissions.some(tp => tp.hasPermission(feature, method));
}

/**
 * Filter family trees to only those where user has specific permission
 * @param treePermissions - Array of family tree permissions  
 * @param feature - Feature code to check
 * @param method - Permission method to check
 * @returns Filtered array of family tree IDs
 */
export function filterTreesByPermission(
    treePermissions: FamilyTreePermissions[],
    feature: FeatureCode,
    method: PermissionMethod
): string[] {
    return treePermissions
        .filter(tp => tp.hasPermission(feature, method))
        .map(tp => tp.ftId);
}

