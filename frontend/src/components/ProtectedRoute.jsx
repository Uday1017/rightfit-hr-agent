import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

export default function ProtectedRoute({ children }) {
  const { user } = useApp();
  return user ? children : <Navigate to="/login" replace />;
}
