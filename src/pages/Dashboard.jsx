import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

const icons = {
  events: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  participants: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.85"/>
    </svg>
  ),
  registrations: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
};

export default function Dashboard() {
  const [stats, setStats]     = useState({ events: 0, participants: 0, registrations: 0 });
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [evts, participants, registrations] = await Promise.all([
          apiFetch("events/"),
          apiFetch("participants/"),
          apiFetch("registrations/"),
        ]);
        setStats({ events: evts.length, participants: participants.length, registrations: registrations.length });
        // 3 prochains events triés par date
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
    { label: "Total Events",        value: stats.events,        key: "events",        color: "#00d4ff", sub: "événements créés" },
    { label: "Total Participants",  value: stats.participants,  key: "participants",  color: "#00e5a0", sub: "profils enregistrés" },
    { label: "Total Registrations", value: stats.registrations, key: "registrations", color: "#a78bfa", sub: "inscriptions actives" },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bonne journée" : "Bonne soirée";

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
            <div className="stat-card-top">
              <div className="stat-icon" style={{ color: c.color }}>{icons[c.key]}</div>
              <div className="stat-badge">↑ actif</div>
            </div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
            <div className="stat-sub">{c.sub}</div>
            <div className="stat-bar">
              <div className="stat-bar-fill" style={{ width: `${Math.min(c.value * 15, 100)}%`, background: c.color }}/>
            </div>
          </div>
        ))}
      </div>

      {/* Prochains events */}
      {events.length > 0 && (
        <div className="dashboard-section">
          <h2 className="section-title">Prochains événements</h2>
          <div className="events-list">
            {events.map((evt) => (
              <div className="event-row" key={evt.id}>
                <div className="event-dot"/>
                <div className="event-info">
                  <span className="event-name">{evt.name || evt.title}</span>
                  <span className="event-date">
                    {evt.date ? new Date(evt.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "Date inconnue"}
                  </span>
                </div>
                <div className="event-location">{evt.location || "—"}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}