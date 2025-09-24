import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
// import { PERMISSIONS } from '../utils/permissions'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import UnauthorizedPage from '@/components/shared/UnauthorizedPage'
import NotFoundPage from '@/components/shared/NotFoundPage'
import DashboardPage from '@/pages/DashboardPage'
import AdminPage from '@/pages/AdminPage'
import AuthLayout from '@/components/layout/AuthLayout'
import MainLayout from '@/components/layout/MainLayout'

const router = createBrowserRouter([
  // Public routes
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <Navigate to={'/login'} replace />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
    ],
  },
  /* Protected Routes */
  // {
  //   path: '/dashboard',
  //   element: (
  //     <ProtectedRoute>
  //       <DashboardPage />
  //     </ProtectedRoute>
  //   )
  // },
  {
    path: '/admin',
    element: (
      <ProtectedRoute requiredRoles={['admin']}>
        <AdminPage />
      </ProtectedRoute>
    ),
  },
  // Example router for requiredPermission route
  // {
  //   path: '/create',
  //   element: (
  //     <ProtectedRoute requiredPermissions={[PERMISSIONS.CREATE_CONTENT]}>
  //       {/* Components here */}
  //     </ProtectedRoute>
  //   ),
  // },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    path: '/dashboard',
    element: (
      <MainLayout>
        <DashboardPage />
      </MainLayout>
    ),
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

export const AppRouter = () => {
  return <RouterProvider router={router} />
}