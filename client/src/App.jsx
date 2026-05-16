import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import DashboardLayout from './Layout/DashboardLayout';
import ApplicationLayout from './Layout/ApplicationLayout';

// Public pages
import Home  from './pages/Home';
import About from './pages/About';

// Auth
import AuthPage from './pages/AuthPage';

// Dashboard pages
import QueryPage     from './pages/QueryPage';
import DatabasesPage from './pages/DatabasesPage';
import UsersPage     from './pages/UsersPage';
import SettingsPage  from './pages/SettingsPage';

const router = createBrowserRouter([
  // ── Marketing site ──
  {
    path: '/',
    element: <ApplicationLayout />,
    children: [
      { index: true,  element: <Home /> },
      { path: 'about', element: <About /> },
    ],
  },

  // ── Auth ──
  { path: '/auth', element: <AuthPage /> },

  // ── Dashboard (protected) ──
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true,        element: <QueryPage /> },
      { path: 'databases',  element: <DatabasesPage /> },
      {
        path: 'users',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <UsersPage />
          </ProtectedRoute>
        ),
      },
      { path: 'settings',   element: <SettingsPage /> },
    ],
  },

  // ── Fallback ──
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
