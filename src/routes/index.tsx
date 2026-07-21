import { Navigate, createBrowserRouter } from 'react-router-dom';

import { AdminPanelPage } from '@/pages/AdminPanel/AdminPanelPage';
import { AdminUsersPage } from '@/pages/AdminPanel/AdminUsersPage';
import { AccountMatchingPage } from '@/pages/Bridge/AccountMatchingPage';
import { AdGroupMatchingPage } from '@/pages/Bridge/AdGroupMatchingPage';
import { AdMatchingPage } from '@/pages/Bridge/AdMatchingPage';
import { CampaignMatchingPage } from '@/pages/Bridge/CampaignMatchingPage';
import { BuyingTypesPage } from '@/pages/Catalog/BuyingTypesPage';
import { ChannelsPage } from '@/pages/Catalog/ChannelsPage';
import { PlatformsPage } from '@/pages/Catalog/PlatformsPage';
import { ClientsPage } from '@/pages/Clients/ClientsPage';
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
        path: '/dashboard/clients',
        element: (
          <RequireRole role="superadmin">
            <ClientsPage />
          </RequireRole>
        ),
      },
      {
        path: '/dashboard/campaigns',
        element: <Navigate to="/dashboard/clients" replace />,
      },
      {
        path: '/dashboard/groupings',
        element: <Navigate to="/dashboard/clients" replace />,
      },
      {
        path: '/dashboard/catalog',
        element: <Navigate to="/dashboard/catalog/platforms" replace />,
      },
      {
        path: '/dashboard/catalog/platforms',
        element: <PlatformsPage />,
      },
      {
        path: '/dashboard/catalog/channels',
        element: <ChannelsPage />,
      },
      {
        path: '/dashboard/catalog/buying-types',
        element: <BuyingTypesPage />,
      },
      {
        path: '/dashboard/bridge',
        element: <Navigate to="/dashboard/bridge/accounts" replace />,
      },
      {
        path: '/dashboard/bridge/accounts',
        element: (
          <RequireRole role="superadmin">
            <AccountMatchingPage />
          </RequireRole>
        ),
      },
      {
        path: '/dashboard/bridge/campaigns',
        element: (
          <RequireRole role="superadmin">
            <CampaignMatchingPage />
          </RequireRole>
        ),
      },
      {
        path: '/dashboard/bridge/ad-groups',
        element: (
          <RequireRole role="superadmin">
            <AdGroupMatchingPage />
          </RequireRole>
        ),
      },
      {
        path: '/dashboard/bridge/ads',
        element: (
          <RequireRole role="superadmin">
            <AdMatchingPage />
          </RequireRole>
        ),
      },
      {
        path: '/dashboard/invites',
        element: <Navigate to="/dashboard/admin/invites" replace />,
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
      {
        path: '/dashboard/admin/invites',
        element: (
          <RequireMinRole minRole="editor">
            <InvitesPage />
          </RequireMinRole>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
