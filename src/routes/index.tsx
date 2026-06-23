import { Navigate, createBrowserRouter } from 'react-router-dom';

import { AdminPanelPage } from '@/pages/AdminPanel/AdminPanelPage';
import { AdminUsersPage } from '@/pages/AdminPanel/AdminUsersPage';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { HomePage } from '@/pages/Home/HomePage';
import { AcceptInvitePage } from '@/pages/Invites/AcceptInvitePage';
import { InvitesPage } from '@/pages/Invites/InvitesPage';
import { RefuseInvitePage } from '@/pages/Invites/RefuseInvitePage';
import { LoginPage } from '@/pages/Login/LoginPage';
import { PasswordForgotPage } from '@/pages/PasswordForgot/PasswordForgotPage';
import { PasswordResetPage } from '@/pages/PasswordReset/PasswordResetPage';
import { GuestRoute, RequireAuth } from '@/routes/GuestRoute';
import { RequireMinRole } from '@/routes/RequireMinRole';
import { RequireRole } from '@/routes/RequireRole';

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/login',
        element: <LoginPage />,
      },
    ],
  },
  {
    path: '/password/forgot',
    element: <PasswordForgotPage />,
  },
  {
    path: '/password/reset/:token',
    element: <PasswordResetPage />,
  },
  {
    path: '/invite/accept/:token',
    element: <AcceptInvitePage />,
  },
  {
    path: '/invite/refuse/:token',
    element: <RefuseInvitePage />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/dashboard/invites',
        element: (
          <RequireMinRole minRole="editor">
            <InvitesPage />
          </RequireMinRole>
        ),
      },
      {
        path: '/dashboard/admin',
        element: <Navigate to="/dashboard/admin/companies" replace />,
      },
      {
        path: '/dashboard/admin/companies',
        element: (
          <RequireRole role="superadmin">
            <AdminPanelPage />
          </RequireRole>
        ),
      },
      {
        path: '/dashboard/admin/users',
        element: (
          <RequireRole role="superadmin">
            <AdminUsersPage />
          </RequireRole>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
