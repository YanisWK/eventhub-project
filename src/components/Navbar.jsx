import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { clearToken, isAuthed, getUserRole } from "../store/authStore";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [roleLabel, setRoleLabel] = useState("");

  useEffect(() => {
    async function loadRole() {
      if (!isAuthed()) { setRoleLabel(""); return; }
      try {
        const role = await getUserRole();
        // Display a role label in the UI
        setRoleLabel(role?.isSuperuser || role?.isStaff ? "Staff" : "Viewer");
      } catch { setRoleLabel(""); }
    }
    loadRole();
  }, [location.pathname]);

  function handleLogout() {
    clearToken();
    localStorage.removeItem("refresh");
    setRoleLabel("");
    navigate("/login");
  }

  if (!isAuthed()) return null;

  return (
    <nav className="navbar">
      <span className="navbar-logo">⬡ Spotly</span>
      <Link to="/dashboard" className={location.pathname === "/dashboard" ? "active" : ""}>Dashboard</Link>
      <Link to="/events"    className={location.pathname.startsWith("/events") ? "active" : ""}>Events</Link>
      <Link to="/participants" className={location.pathname === "/participants" ? "active" : ""}>Participants</Link>

      <div className="navbar-spacer" />

      {/* Role badge to show role-based behavior */}
      {roleLabel && (
        <span className={`role-badge ${roleLabel === "Viewer" ? "viewer" : ""}`}>
          {roleLabel}
        </span>
      )}
      <button className="btn-logout" onClick={handleLogout}>Logout</button>
    </nav>
  );
}