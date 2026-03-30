import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { clearToken, isAuthed, getUserRole } from "../store/authStore";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [roleLabel, setRoleLabel] = useState("");

  useEffect(() => {
    async function loadRole() {
      if (!isAuthed()) {
        setRoleLabel("");
        return;
      }

      try {
        const role = await getUserRole();

        if (role?.isSuperuser || role?.isStaff) {
          setRoleLabel("Staff");
        } else {
          setRoleLabel("Viewer");
        }
      } catch {
        setRoleLabel("");
      }
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
    <nav
      style={{
        padding: "1rem",
        borderBottom: "1px solid #ddd",
        display: "flex",
        alignItems: "center",
        gap: "1rem"
      }}
    >
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/events">Events</Link>
      <Link to="/participants">Participants</Link>

      {roleLabel && (
        <span
          style={{
            marginLeft: "auto",
            padding: "6px 10px",
            background: roleLabel === "Staff" ? "#d1fae5" : "#f3f4f6",
            borderRadius: "999px",
            fontWeight: "bold"
          }}
        >
          Role: {roleLabel}
        </span>
      )}

      <button onClick={handleLogout}>Logout</button>
    </nav>
  );
}