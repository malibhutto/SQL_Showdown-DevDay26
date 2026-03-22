import { Navigate } from "react-router-dom";
import { useAdmin } from "../contexts/AdminContext";
import { FullScreenStatus } from "./FullScreenStatus";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { isAuthenticated, isLoading } = useAdmin();

  if (isLoading) {
    return <FullScreenStatus subtitle="VERIFYING ADMIN CLEARANCE..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
