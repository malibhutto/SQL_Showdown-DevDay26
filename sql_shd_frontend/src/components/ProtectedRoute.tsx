import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FullScreenStatus } from "./FullScreenStatus";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  // Wait for auth state to be loaded before redirecting
  if (loading) {
    return <FullScreenStatus subtitle="VERIFYING TEAM CREDENTIALS..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
