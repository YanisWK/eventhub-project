import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setToken } from "../store/authStore";
import { API_BASE } from "../api/client";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // login form submission and stores JWT tokens
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data?.detail || "Login failed";
        if (msg === "No active account found with the given credentials") {
          throw new Error("Invalid username or password.");
        }
        throw new Error(msg);
      }

      // Stores access and refresh tokens, redirects to the dashboard
      setToken(data.access);
      localStorage.setItem("refresh", data.refresh);
      navigate("/dashboard");
    } catch (err) {
      // backend connection errors
      if (err.message === "Failed to fetch") {
        setError("Backend unavailable.");
      } else {
        setError(err.message || "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h1 className="login-title">Welcome back</h1>
        <p className="login-subtitle">Sign in to your Spotly account</p>

        {/* Login form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>

          {/* submit button disabled while login request */}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        {error && (
          <div className="alert-error">
            <div className="alert-error-text">{error}</div>
          </div>
        )}
      </div>
    </div>
  );
}