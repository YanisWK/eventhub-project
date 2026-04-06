import { Link } from "react-router-dom";
import { isAuthed } from "../store/authStore";

export default function NotFound() {
  const authed = isAuthed();

  return (
    <div className="page" style={{ textAlign: "center", padding: "4rem 1.5rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>404</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
        Page introuvable
      </p>
        {/* Redirects logged-in users to the dashboard or login page */}
      <Link
        to={authed ? "/dashboard" : "/login"}
        className="btn-primary"
        style={{
          display: "inline-block",
          width: "auto",
          padding: "10px 20px",
          textDecoration: "none",
        }}
      >
        {authed ? "Back to dashboard" : "Go to login"}
      </Link>
    </div>
  );
}