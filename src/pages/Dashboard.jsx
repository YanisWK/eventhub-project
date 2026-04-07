import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import "./Dashboard.css";
export default function Dashboard() {
  const [stats, setStats]       = useState({ events: 0, participants: 0, registrations: 0 });
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [animated, setAnimated] = useState(false);

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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bonne journée" : "Bonne soirée";

  const cards = [
    { label: "Total Events",        value: stats.events,        color: "#00d4ff" },
    { label: "Total Participants",  value: stats.participants,  color: "#00e5a0" },
    { label: "Total Registrations", value: stats.registrations, color: "#a78bfa" },
  ];

  return (
    <div className="page">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="dashboard-subtitle">{greeting} 👋 Voici un aperçu de votre activité</p>
        </div>
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
            <div className="stat-bar">
              <div className="stat-bar-fill" style={{ width: `${Math.min(c.value * 15, 100)}%`, background: c.color }}/>
            </div>
          </div>
        ))}
      </div>

      {/* Prochains events */}
      {events.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Prochains événements</h2>
            <span className="section-count">{events.length} à venir</span>
          </div>
          <div className="events-list">
            {events.map((evt, i) => {
              const date  = evt.date ? new Date(evt.date) : null;
              const day   = date ? date.toLocaleDateString("fr-FR", { day: "numeric" }) : "—";
              const month = date ? date.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase() : "—";
              return (
                <div className="event-row" key={evt.id}>
                  <div className="event-date-block">
                    <span className="event-day">{day}</span>
                    <span className="event-month">{month}</span>
                  </div>
                  <div className="event-info">
                    <span className="event-name">{evt.name || evt.title}</span>
                    <span className="event-location">{evt.location || "Lieu non défini"}</span>
                  </div>
                  <div className={`event-status event-status--${i === 0 ? "soon" : "upcoming"}`}>
                    {i === 0 ? "Prochain" : "À venir"}
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