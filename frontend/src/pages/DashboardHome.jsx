import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * DashboardHome serves as a smart redirector.
 * It detects the user's role and sends them to the appropriate dashboard.
 */
export default function DashboardHome() {
  const { user, loading } = useAuth();

  if (loading) return null; // Let the ProtectedRoute handle loading if needed

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'superadmin') {
    return <Navigate to="/dashboard/superadmin" replace />;
  }

  if (user.role === 'manager') {
    return <Navigate to="/dashboard/manager" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/dashboard/admin" replace />;
  }

  // Default for inspectors and others
  return <Navigate to="/dashboard/inspector" replace />;
}
