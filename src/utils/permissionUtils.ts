import type { FTAuthList } from '@/types/familytree';
import type { FeatureCode, PermissionMethod, FeaturePermissions } from '@/stores/slices/permissionSlice';

/**
 * Extract current user's permissions from the API response
 * @param response - API response containing permission data
 * @param userId - Current user's ID (not used since API is already filtered)
 * @returns Feature permissions for the current user
 */
export function extractUserPermissions(
    response: FTAuthList[]
): FeaturePermissions {
    const permissions: FeaturePermissions = {};

    // The response is an array with one item containing ftId and datalist
    if (!response || response.length === 0) {
        return permissions;
    }

    const ftAuthData = response[0];

    if (!ftAuthData || !ftAuthData.datalist || ftAuthData.datalist.length === 0) {
        return permissions;
    }

    // API is already filtered by userId in the request, so we can directly use the first item
    const userPermissionData = ftAuthData.datalist[0];

    // Extract owner role from key.fullname
    if (userPermissionData?.key?.fullname === 'Owner') {
        permissions.isOwner = true;
    } else {
        permissions.isOwner = false;
    }

    // Map the permissions to our structure
    userPermissionData?.value.forEach((authProp) => {
        const featureCode = authProp.featureCode as FeatureCode;
        const methods = authProp.methodsList as PermissionMethod[];

        permissions[featureCode] = methods;
    });

    return permissions;
}

/**
 * Check if user has a specific permission for a feature
 * @param permissions - User's feature permissions
 * @param feature - Feature code (EVENT, FUND, MEMBER)
 * @param method - Permission method (VIEW, ADD, UPDATE, DELETE)
 * @returns True if user has the permission
 */
export function hasPermission(
    permissions: FeaturePermissions,
    feature: FeatureCode,
    method: PermissionMethod
): boolean {
    const featurePermissions = permissions[feature];
    return featurePermissions ? featurePermissions.includes(method) : false;
}

/**
 * Get all permissions for a specific feature
 * @param permissions - User's feature permissions
 * @param feature - Feature code (EVENT, FUND, MEMBER)
 * @returns Array of permission methods for the feature
 */
export function getFeaturePermissions(
    permissions: FeaturePermissions,
    feature: FeatureCode
): PermissionMethod[] {
    return permissions[feature] || [];
}

/**
 * Check if user can view a feature
 */
export function canView(permissions: FeaturePermissions, feature: FeatureCode): boolean {
    return hasPermission(permissions, feature, 'VIEW');
}

/**
 * Check if user can add to a feature
 */
export function canAdd(permissions: FeaturePermissions, feature: FeatureCode): boolean {
    return hasPermission(permissions, feature, 'ADD');
}

/**
 * Check if user can update a feature
 */
export function canUpdate(permissions: FeaturePermissions, feature: FeatureCode): boolean {
    return hasPermission(permissions, feature, 'UPDATE');
}

/**
 * Check if user can delete from a feature
 */
export function canDelete(permissions: FeaturePermissions, feature: FeatureCode): boolean {
    return hasPermission(permissions, feature, 'DELETE');
}

/**
 * Format permissions for logging
 * @param permissions - User's feature permissions
 * @param feature - Feature code
 * @returns Formatted string for console logging
 */
export function formatPermissionsForLogging(
    permissions: FeaturePermissions,
    feature: FeatureCode
): string {
    const featurePermissions = getFeaturePermissions(permissions, feature);

    if (featurePermissions.length === 0) {
        return `[${feature}] No permissions`;
    }

    return `[${feature}] Permissions: ${featurePermissions.join(', ')}`;
}
