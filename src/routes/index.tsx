import { Navigate, createBrowserRouter } from 'react-router-dom';

import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { HomePage } from '@/pages/Home/HomePage';
import { LoginPage } from '@/pages/Login/LoginPage';
import { PasswordForgotPage } from '@/pages/PasswordForgot/PasswordForgotPage';
import { PasswordResetPage } from '@/pages/PasswordReset/PasswordResetPage';
import { GuestRoute, RequireAuth } from '@/routes/GuestRoute';

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
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
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
