import { Navigate } from "react-router-dom";
import { isAuthed } from "../store/authStore";

// No access to protected pages when the user is not logged in
export default function ProtectedRoute({ children }) {
  if (!isAuthed()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}