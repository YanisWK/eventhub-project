import { Link, useNavigate } from "react-router-dom";
import { clearToken, isAuthed } from "../store/authStore";

export default function Navbar() {
  const navigate = useNavigate();

  function handleLogout() {
    clearToken();
    localStorage.removeItem("refresh");
    navigate("/login");
  }

  if (!isAuthed()) return null;

  return (
    <nav style={{ padding: "16px", borderBottom: "1px solid #ddd", marginBottom: "20px" }}>
      <Link to="/dashboard" style={{ marginRight: "12px" }}>Dashboard</Link>
      <Link to="/participants" style={{ marginRight: "12px" }}>Participants</Link>
      <Link to="/events" style={{ marginRight: "12px" }}>Events</Link>
      <button onClick={handleLogout}>Logout</button>
    </nav>
  );
}