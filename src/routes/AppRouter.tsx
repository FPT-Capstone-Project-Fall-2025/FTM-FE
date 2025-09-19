import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppSelector } from '../hooks/redux'
import { ProtectedRoute, RoleBasedLayout } from './ProtectedRoute'
import { PERMISSIONS } from '../utils/permissions'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'

// Page Components
const DashboardPage: React.FC = () => (
  <RoleBasedLayout>
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to your dashboard!</p>
    </div>
  </RoleBasedLayout>
)

const CreateContentPage: React.FC = () => (
  <RoleBasedLayout>
    <div>
      <h1>Create Content</h1>
      <p>Create new content here.</p>
    </div>
  </RoleBasedLayout>
)

const ModeratePage: React.FC = () => (
  <RoleBasedLayout>
    <div>
      <h1>Content Moderation</h1>
      <p>Moderate user content here.</p>
    </div>
  </RoleBasedLayout>
)

const AdminPage: React.FC = () => (
  <RoleBasedLayout>
    <div>
      <h1>Admin Panel</h1>
      <p>Administrative controls and settings.</p>
    </div>
  </RoleBasedLayout>
)

const AdminUsersPage: React.FC = () => (
  <RoleBasedLayout>
    <div>
      <h1>User Management</h1>
      <p>Manage users, roles, and permissions.</p>
    </div>
  </RoleBasedLayout>
)

const AnalyticsPage: React.FC = () => (
  <RoleBasedLayout>
    <div>
      <h1>Analytics</h1>
      <p>View application analytics and reports.</p>
    </div>
  </RoleBasedLayout>
)

const ProfilePage: React.FC = () => {
  const { user } = useAppSelector(state => state.auth)
  
  return (
    <RoleBasedLayout>
      <div>
        <h1>Profile</h1>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
          <h3>User Information</h3>
          <p><strong>Name:</strong> {user?.name}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Role:</strong> {user?.role}</p>
          <p><strong>Member Since:</strong> {user?.createdAt}</p>
          
          <h4>Permissions:</h4>
          <ul>
            {user?.permissions.map(permission => (
              <li key={permission}>{permission.replace('_', ' ').toUpperCase()}</li>
            ))}
          </ul>
        </div>
      </div>
    </RoleBasedLayout>
  )
}

const UnauthorizedPage: React.FC = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    textAlign: 'center'
  }}>
    <h1 style={{ fontSize: '72px', margin: '0', color: '#e74c3c' }}>403</h1>
    <h2>Access Denied</h2>
    <p>You don't have permission to access this resource.</p>
    <button
      onClick={() => window.history.back()}
      style={{
        padding: '12px 24px',
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginTop: '20px'
      }}
    >
      Go Back
    </button>
  </div>
)

const NotFoundPage: React.FC = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    textAlign: 'center'
  }}>
    <h1 style={{ fontSize: '72px', margin: '0', color: '#95a5a6' }}>404</h1>
    <h2>Page Not Found</h2>
    <p>The page you're looking for doesn't exist.</p>
    <a
      href="/dashboard"
      style={{
        padding: '12px 24px',
        backgroundColor: '#3498db',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '4px',
        marginTop: '20px'
      }}
    >
      Go to Dashboard
    </a>
  </div>
)

// Public Route Component - redirects to dashboard if already authenticated
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppSelector(state => state.auth)
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

// Main App Router
export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />

        <Route path="/create" element={
          <ProtectedRoute requiredPermissions={[PERMISSIONS.CREATE_CONTENT]}>
            <CreateContentPage />
          </ProtectedRoute>
        } />

        <Route path="/moderate" element={
          <ProtectedRoute requiredPermissions={[PERMISSIONS.MODERATE_CONTENT]}>
            <ModeratePage />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminPage />
          </ProtectedRoute>
        } />

        <Route path="/admin/users" element={
          <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_USERS]}>
            <AdminUsersPage />
          </ProtectedRoute>
        } />

        <Route path="/analytics" element={
          <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_ANALYTICS]}>
            <AnalyticsPage />
          </ProtectedRoute>
        } />

        {/* Error Routes */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Default Routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}