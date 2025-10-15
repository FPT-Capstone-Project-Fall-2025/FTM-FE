import type { User, UserRole } from "@/types/user"

export const PERMISSIONS = {
    // User management
    VIEW_USERS: 'view_users',
    CREATE_USERS: 'create_users',
    EDIT_USERS: 'edit_users',
    DELETE_USERS: 'delete_users',

    // Content management
    VIEW_CONTENT: 'view_content',
    CREATE_CONTENT: 'create_content',
    EDIT_CONTENT: 'edit_content',
    DELETE_CONTENT: 'delete_content',
    MODERATE_CONTENT: 'moderate_content',

    // Admin features
    VIEW_ANALYTICS: 'view_analytics',
    MANAGE_SETTINGS: 'manage_settings',
    MANAGE_ROLES: 'manage_roles',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    admin: [
        PERMISSIONS.VIEW_USERS,
        PERMISSIONS.CREATE_USERS,
        PERMISSIONS.EDIT_USERS,
        PERMISSIONS.DELETE_USERS,
        PERMISSIONS.VIEW_CONTENT,
        PERMISSIONS.CREATE_CONTENT,
        PERMISSIONS.EDIT_CONTENT,
        PERMISSIONS.DELETE_CONTENT,
        PERMISSIONS.MODERATE_CONTENT,
        PERMISSIONS.VIEW_ANALYTICS,
        PERMISSIONS.MANAGE_SETTINGS,
        PERMISSIONS.MANAGE_ROLES,
    ],
    user: [
        PERMISSIONS.VIEW_CONTENT,
        PERMISSIONS.CREATE_CONTENT,
        PERMISSIONS.EDIT_CONTENT,
    ],
    guest: [
        PERMISSIONS.VIEW_CONTENT,
    ],
}

// Utility functions
export const hasPermission = (user: User | null, permission: Permission): boolean => {
    if (!user) return false
    return user.permissions.includes(permission) 
    // || ROLE_PERMISSIONS[user.role].includes(permission)
}

export const hasRole = (user: User | null, role: UserRole): boolean => {
    if (!user) return false
    return user.role === role
}

export const hasAnyRole = (user: User | null, roles: UserRole[]): boolean => {
    if (!user) return false
    return roles.includes(user.role)
}

export const canAccessRoute = (user: User | null, requiredPermissions: Permission[]): boolean => {
    if (!user || !requiredPermissions.length) return false
    return requiredPermissions.some(permission => hasPermission(user, permission))
}

// Route access definitions
export const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
    // '/admin': [PERMISSIONS.MANAGE_SETTINGS],
    // '/admin/users': [PERMISSIONS.VIEW_USERS],
    // '/admin/analytics': [PERMISSIONS.VIEW_ANALYTICS],
    // '/dashboard': [PERMISSIONS.VIEW_CONTENT],
    // '/create': [PERMISSIONS.CREATE_CONTENT],
    // '/moderate': [PERMISSIONS.MODERATE_CONTENT],
}