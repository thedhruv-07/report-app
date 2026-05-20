// frontend/src/components/auth/OnboardingGuard.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function OnboardingGuard() {
  const { user, onboardingCompleted } = useAuth();

  // Show spinner while onboarding status is being fetched (null = loading)
  if (user?.role === 'inspector' && onboardingCompleted === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect incomplete inspectors to onboarding
  if (user?.role === 'inspector' && onboardingCompleted === false) {
    return <Navigate to="/dashboard/inspector/onboarding" replace />;
  }

  return <Outlet />;
}
