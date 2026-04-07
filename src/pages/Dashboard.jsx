import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import "./Dashboard.css";

export default function Dashboard() {
  const [stats, setStats]       = useState({ events: 0, participants: 0, registrations: 0 });
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [animated, setAnimated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [evts, participants, registrations] = await Promise.all([
          apiFetch("events/"),
          apiFetch("participants/"),
          apiFetch("registrations/"),
        ]);
        setStats({
          events:        evts.length,
          participants:  participants.length,
          registrations: registrations.length,
        });
        const sorted = [...evts].sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(sorted.slice(0, 3));
      } catch (err) { setError(err.message); }
      finally {
        setLoading(false);
        setTimeout(() => setAnimated(true), 100);
      }
    }
    loadDashboard();
  }, []);

  if (loading) return (
    <div className="page">
      <div className="skeleton-grid">
        {[1,2,3].map(i => <div key={i} className="skeleton-card"/>)}
      </div>
    </div>
  );
  if (error) return <div className="page"><p className="alert-error">{error}</p></div>;

  const cards = [
    { label: "Events",         value: stats.events,        color: "#00d4ff" },
    { label: "Participants",   value: stats.participants,  color: "#00e5a0" },
    { label: "Registrations",  value: stats.registrations, color: "#a78bfa" },
  ];

  return (
    <div className="page">
      <div className="dashboard-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        {cards.map((c, i) => (
          <div
            className={`stat-card stat-card--enhanced ${animated ? "stat-card--visible" : ""}`}
            key={c.label}
            style={{ "--card-color": c.color, "--delay": `${i * 80}ms` }}
          >
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Upcoming Events */}
      {events.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Upcoming Events</h2>
            <span className="section-count">{events.length} upcoming</span>
          </div>
          <div className="events-list">
            {events.map((evt, i) => {
              const date  = evt.date ? new Date(evt.date) : null;
              const day   = date ? date.toLocaleDateString("en-GB", { day: "numeric" }) : "—";
              const month = date ? date.toLocaleDateString("en-GB", { month: "short" }).toUpperCase() : "—";
              return (
                <div
                  className="event-row"
                  key={evt.id}
                  onClick={() => navigate(`/events/${evt.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="event-date-block">
                    <span className="event-day">{day}</span>
                    <span className="event-month">{month}</span>
                  </div>
                  <div className="event-info">
                    <span className="event-name">{evt.name || evt.title}</span>
                    <span className="event-location">{evt.location || "Location not defined"}</span>
                  </div>
                  <div className={`event-status event-status--${i === 0 ? "soon" : "upcoming"}`}>
                    {i === 0 ? "Next" : "Upcoming"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}