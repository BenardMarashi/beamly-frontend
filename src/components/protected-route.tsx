import React from "react";
import { Navigate, Outlet } from "react-router-dom";

interface ProtectedRouteProps {
  isLoggedIn: boolean;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  isLoggedIn,
  redirectTo = "/login"
}) => {
  if (!isLoggedIn) {
    return <Navigate to={redirectTo} replace />;
  }
  
  return <Outlet />;
};