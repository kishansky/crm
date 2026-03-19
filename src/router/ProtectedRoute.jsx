import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {

  const token = localStorage.getItem("token");

  // ❌ NOT LOGGED IN
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // ✅ LOGGED IN
  return children;
}