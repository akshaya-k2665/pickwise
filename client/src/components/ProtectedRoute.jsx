import React from "react";
import { Navigate } from "react-router-dom";

function decodeJwtPayload(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const payload = decodeJwtPayload(token);
    const userRole = payload?.role;
    if (!userRole || userRole !== requiredRole) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
