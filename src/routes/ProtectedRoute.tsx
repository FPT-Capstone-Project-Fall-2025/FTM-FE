// src/components/ProtectedRoute.tsx
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/hooks/redux'
import { hasPermission, hasAnyRole, canAccessRoute } from '@/utils/permissions'
import { type Permission, ROUTE_PERMISSIONS } from '@/utils/permissions'
import type { UserRole } from '@/types/user'

interface ProtectedRouteProps {
    children: React.ReactNode
    requiredRoles?: UserRole[]
    requiredPermissions?: Permission[]
    redirectTo?: string
    fallback?: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requiredRoles = [],
    requiredPermissions = [],
    redirectTo = '/login',
    fallback = null,
}) => {
    const location = useLocation()
    const { user, isAuthenticated, isLoading } = useAppSelector(state => state.auth)

    // Show loading spinner while checking authentication
    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
            }}>
                <div>Loading...</div>
            </div>
        )
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />
    }

    // Check route-based permissions first
    const routePermissions = ROUTE_PERMISSIONS[location.pathname]
    if (routePermissions && !canAccessRoute(user, routePermissions)) {
        return fallback || <Navigate to="/unauthorized" replace />
    }

    // Check required roles
    if (requiredRoles.length > 0 && !hasAnyRole(user, requiredRoles)) {
        return fallback || <Navigate to="/unauthorized" replace />
    }

    // Check required permissions
    if (requiredPermissions.length > 0) {
        const hasRequiredPermissions = requiredPermissions.some(permission =>
            hasPermission(user, permission)
        )
        if (!hasRequiredPermissions) {
            return fallback || <Navigate to="/unauthorized" replace />
        }
    }

    return <>{children}</>
}

// Higher-order component for role-based access
export const withRoleAccess = <P extends object>(
    Component: React.ComponentType<P>,
    requiredRoles: UserRole[]
) => {
    return (props: P) => (
        <ProtectedRoute requiredRoles={requiredRoles}>
            <Component {...props} />
        </ProtectedRoute>
    )
}

// Higher-order component for permission-based access
export const withPermissionAccess = <P extends object>(
    Component: React.ComponentType<P>,
    requiredPermissions: Permission[]
) => {
    return (props: P) => (
        <ProtectedRoute requiredPermissions={requiredPermissions}>
            <Component {...props} />
        </ProtectedRoute>
    )
}

// Component for conditionally rendering based on permissions
interface ConditionalRenderProps {
    children: React.ReactNode
    roles?: UserRole[]
    permissions?: Permission[]
    fallback?: React.ReactNode
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
    children,
    roles = [],
    permissions = [],
    fallback = null,
}) => {
    const { user } = useAppSelector(state => state.auth)

    const hasRequiredRole = roles.length === 0 || hasAnyRole(user, roles)
    const hasRequiredPermission = permissions.length === 0 ||
        permissions.some(permission => hasPermission(user, permission))

    if (hasRequiredRole && hasRequiredPermission) {
        return <>{children}</>
    }

    return <>{fallback}</>
}

// Layout wrapper with role-based navigation
export const RoleBasedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAppSelector(state => state.auth)

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <nav style={{
                width: '250px',
                backgroundColor: '#2c3e50',
                color: 'white',
                padding: '20px'
            }}>
                <div style={{ marginBottom: '30px' }}>
                    <h3>Welcome, {user?.name}</h3>
                    <p style={{ color: '#bdc3c7', fontSize: '14px' }}>Role: {user?.role}</p>
                </div>

                <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li style={{ marginBottom: '10px' }}>
                        <a href="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>
                            Dashboard
                        </a>
                    </li>

                    <ConditionalRender permissions={['create_content']}>
                        <li style={{ marginBottom: '10px' }}>
                            <a href="/create" style={{ color: 'white', textDecoration: 'none' }}>
                                Create Content
                            </a>
                        </li>
                    </ConditionalRender>

                    <ConditionalRender permissions={['moderate_content']}>
                        <li style={{ marginBottom: '10px' }}>
                            <a href="/moderate" style={{ color: 'white', textDecoration: 'none' }}>
                                Moderate Content
                            </a>
                        </li>
                    </ConditionalRender>

                    <ConditionalRender roles={['admin']}>
                        <li style={{ marginBottom: '10px' }}>
                            <a href="/admin" style={{ color: 'white', textDecoration: 'none' }}>
                                Admin Panel
                            </a>
                        </li>
                    </ConditionalRender>

                    <ConditionalRender permissions={['view_analytics']}>
                        <li style={{ marginBottom: '10px' }}>
                            <a href="/analytics" style={{ color: 'white', textDecoration: 'none' }}>
                                Analytics
                            </a>
                        </li>
                    </ConditionalRender>
                </ul>
            </nav>

            <main style={{ flex: 1, padding: '20px', backgroundColor: '#ecf0f1' }}>
                {children}
            </main>
        </div>
    )
}