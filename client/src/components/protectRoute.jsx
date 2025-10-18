import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

  // Not logged in → redirect to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // If a role is required but user doesn’t match → redirect to home
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // Otherwise → allow access
  return children;
}

export default ProtectedRoute;
