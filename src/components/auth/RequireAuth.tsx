import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authStorage } from "@/api/http";

interface RequireAuthProps {
  children: ReactNode;
}

const RequireAuth = ({ children }: RequireAuthProps) => {
  const location = useLocation();
  const token = authStorage.getAccessToken();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default RequireAuth;

