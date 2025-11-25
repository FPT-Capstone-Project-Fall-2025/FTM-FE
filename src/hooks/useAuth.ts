import { useCallback, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from './redux'
import { logout, refreshUserToken } from '@/stores/slices/authSlice'
import { hasPermission, hasRole, hasAnyRole } from '../utils/permissions'
import { type Permission } from '../utils/permissions'
import type { UserRole } from '@/types/user'

export const useAuth = () => {
    const dispatch = useAppDispatch()
    const authState = useAppSelector(state => state.auth)

    // Auto-refresh token when it's about to expire
    useEffect(() => {
        if (authState.token && authState.isAuthenticated) {
            // Decode token to check expiration (simplified - implement actual JWT decoding)
            const checkTokenExpiry = () => {
                try {
                    // This would be actual JWT token decoding
                    const tokenParts = authState.token!.split('.')
                    const tokenPayload = JSON.parse(atob(tokenParts[1] ?? ''))
                    const currentTime = Date.now() / 1000
                    const timeUntilExpiry = tokenPayload.exp - currentTime

                    // Refresh token if it expires in less than 5 minutes
                    if (timeUntilExpiry < 300) {
                        dispatch(refreshUserToken())
                    }
                } catch (error) {
                    console.error('Error checking token expiry:', error)
                }
            }

            // Check token every minute
            const interval = setInterval(checkTokenExpiry, 60000)
            return () => clearInterval(interval)
        }
    }, [authState.token, authState.isAuthenticated, dispatch])

    const logoutUser = useCallback(() => {
        dispatch(logout())
        // Clear any additional local storage or session data
        localStorage.removeItem('persist:root')
    }, [dispatch])

    const checkPermission = useCallback((permission: Permission): boolean => {
        return hasPermission(authState.user, permission)
    }, [authState.user])

    const checkRole = useCallback((role: UserRole): boolean => {
        return hasRole(authState.user, role)
    }, [authState.user])

    const checkAnyRole = useCallback((roles: UserRole[]): boolean => {
        return hasAnyRole(authState.user, roles)
    }, [authState.user])

    const isAdmin = useCallback((): boolean => {
        return hasRole(authState.user, 'admin')
    }, [authState.user])

    return {
        // Auth state
        ...authState,

        // Actions
        logout: logoutUser,

        // Permission checks
        checkPermission,
        checkRole,
        checkAnyRole,
        isAdmin,

        // Computed values
        userDisplayName: authState.user?.name || authState.user?.email || 'User',
        userInitials: authState.user?.name
            ?.split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase() || 'U',
    }
}

// Hook for loading user data on app initialization
export const useAuthInitialization = () => {
    const dispatch = useAppDispatch()
    const { token, isAuthenticated } = useAppSelector(state => state.auth)
    
    useEffect(() => {
        // Check if we have a persisted token but no user data
        if (token && !isAuthenticated) {
            // Validate token with backend and get user data
            dispatch(refreshUserToken())
        }
    }, [token, isAuthenticated, dispatch])
}

// Hook for role-based component rendering
export const useRoleBasedAccess = (
    requiredRoles: UserRole[] = [],
    requiredPermissions: Permission[] = []
) => {
    const { user } = useAppSelector(state => state.auth)

    const hasRequiredRole = requiredRoles.length === 0 || hasAnyRole(user, requiredRoles)
    const hasRequiredPermission = requiredPermissions.length === 0 ||
        requiredPermissions.some(permission => hasPermission(user, permission))

    return {
        hasAccess: hasRequiredRole && hasRequiredPermission,
        user,
        roles: requiredRoles,
        permissions: requiredPermissions
    }
}