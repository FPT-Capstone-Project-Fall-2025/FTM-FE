import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
// import { PERMISSIONS } from '../utils/permissions'
import LoginPage from '@/pages/Auth/LoginPage'
import RegisterPage from '@/pages/Auth/RegisterPage'
import UnauthorizedPage from '@/components/shared/UnauthorizedPage'
import NotFoundPage from '@/components/shared/NotFoundPage'
import HomePage from '@/pages/HomePage'
import AdminPage from '@/pages/Admin/AdminPage'
import AuthLayout from '@/components/layout/AuthLayout'
import MainLayout from '@/components/layout/MainLayout'
import MyAccountPage from '@/pages/MyAccount/MyAccountPage'
import ForgotPassword from '@/pages/Auth/ForgotPassword'
import ResetPassword from '@/pages/Auth/ResetPassword'
import GroupPostPage from '@/pages/Post/GroupPostPage'
import PostPage from '@/pages/Post/PostPage'
import FamilyTreePage from '@/pages/FamilytreeList/FamilyTreePage'
import FamilyTreeSelection from '@/pages/FamilytreeList/FamilyTreeSelection'
import EventPage from '@/pages/Event/EventPage'
import SettingPage from '@/pages/Settings/SettingPage'
import NotificationPage from '@/pages/Notification/NotificationPage'
import CampaignDetailPage from '@/pages/Campaign/CampaignDetailPage'
// PostDetailPage is used as a modal in PostPage, not a standalone route
// import PostDetailPage from '@/pages/Post/PostDetailPage'

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
      {
        path: 'forgot-password',
        element: <ForgotPassword />,
      },
      {
        path: 'reset-password',
        element: <ResetPassword />,
      },
    ],
  },
  {
    path: '/campaigns/:campaignId',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <CampaignDetailPage />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  /* Protected Routes */
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <MyAccountPage />
        </MainLayout>
      </ProtectedRoute>
    )
  },
  {
    path: '/home',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <HomePage />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/family-trees',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <FamilyTreeSelection />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/family-trees/:treeId',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <FamilyTreePage />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/events',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <EventPage />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/group',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <GroupPostPage />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/group/:id',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <PostPage />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  // PostDetailPage is used as a modal, not a standalone route
  // {
  //   path: '/post/:id',
  //   element: (
  //     <ProtectedRoute>
  //       <MainLayout>
  //         <PostDetailPage />
  //       </MainLayout>
  //     </ProtectedRoute>
  //   ),
  // },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <SettingPage />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/notification',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <NotificationPage />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
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
    path: '*',
    element: <NotFoundPage />,
  },
])

export const AppRouter = () => {
  return <RouterProvider router={router} />
}