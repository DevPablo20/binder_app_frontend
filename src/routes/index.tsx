import { Navigate, createBrowserRouter } from 'react-router-dom';

import { AdminPanelPage } from '@/pages/AdminPanel/AdminPanelPage';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { HomePage } from '@/pages/Home/HomePage';
import { LoginPage } from '@/pages/Login/LoginPage';
import { PasswordForgotPage } from '@/pages/PasswordForgot/PasswordForgotPage';
import { PasswordResetPage } from '@/pages/PasswordReset/PasswordResetPage';
import { GuestRoute, RequireAuth } from '@/routes/GuestRoute';
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
    element: <RequireAuth />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/dashboard/admin',
        element: (
          <RequireRole role="superadmin">
            <AdminPanelPage />
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
