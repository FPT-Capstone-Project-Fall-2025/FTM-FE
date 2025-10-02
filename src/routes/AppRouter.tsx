import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
// import { PERMISSIONS } from '../utils/permissions'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import UnauthorizedPage from '@/components/shared/UnauthorizedPage'
import NotFoundPage from '@/components/shared/NotFoundPage'
import LandingPage from '@/pages/LandingPage'
import HomePage from '@/pages/HomePage'
import DashboardPage from '@/pages/DashboardPage'
import FamilyTreePage from '@/pages/FamilyTreePage'
import AdminPage from '@/pages/AdminPage'
import LandingPageLayout from '@/components/layout/LandingPageLayout'
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
    path: '/landing',
    element: (
      <LandingPageLayout>
        <LandingPage />
      </LandingPageLayout>
    ),
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
    path: '/home',
    element: (
      <MainLayout>
        <HomePage />
      </MainLayout>
    ),
  },
  {
    path: '/family-trees',
    element: (
      <MainLayout>
        <FamilyTreePage />
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