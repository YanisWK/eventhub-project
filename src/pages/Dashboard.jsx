import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

export default function Dashboard() {
  const [stats, setStats] = useState({ events: 0, participants: 0, registrations: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [events, participants, registrations] = await Promise.all([
          apiFetch("events/"),
          apiFetch("participants/"),
          apiFetch("registrations/")
        ]);
        setStats({ events: events.length, participants: participants.length, registrations: registrations.length });
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    }
    loadDashboard();
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error)   return <div className="page"><p className="alert-error">{error}</p></div>;

  const cards = [
    { label: "Total Events",        value: stats.events        },
    { label: "Total Participants",  value: stats.participants  },
    { label: "Total Registrations", value: stats.registrations },
  ];

  return (
    <div className="page">
      <h1 className="page-title">Dashboard</h1>
      <div className="stats-grid">
        {cards.map(c => (
          <div className="stat-card" key={c.label}>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}