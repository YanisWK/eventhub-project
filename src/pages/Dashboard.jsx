import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import "./Dashboard.css";

export default function Dashboard() {
  const [stats, setStats] = useState({ events: 0, participants: 0, registrations: 0 });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [animated, setAnimated] = useState(false);

  const navigate = useNavigate();

  // Loads dashboard stats and the latest events
  const loadDashboard = useCallback(async () => {
    try {
      setError("");

      const [evts, participants, registrations] = await Promise.all([
        apiFetch("events/"),
        apiFetch("participants/"),
        apiFetch("registrations/"),
      ]);

      setStats({
        events: evts.length,
        participants: participants.length,
        registrations: registrations.length,
      });

      const upcomingEvents = evts
        .filter((event) => event.status === "upcoming")
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      setEvents(upcomingEvents.slice(0, 3));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setAnimated(true), 100);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Reloads dashboard data
  useEffect(() => {
    function handleFocus() {
      loadDashboard();
    }
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="page">
        <div className="skeleton-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <p className="alert-error">{error}</p>
      </div>
    );
  }

  const cards = [
    { label: "Events", value: stats.events, color: "#00d4ff" },
    { label: "Participants", value: stats.participants, color: "#00e5a0" },
    { label: "Registrations", value: stats.registrations, color: "#a78bfa" },
  ];

  return (
    <div className="page">
      <div className="dashboard-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      {/* Summary cards */}
      <div className="stats-grid">
        {cards.map((card, i) => (
          <div
            className={`stat-card stat-card--enhanced ${animated ? "stat-card--visible" : ""}`}
            key={card.label}
            style={{ "--card-color": card.color, "--delay": `${i * 80}ms` }}
          >
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Upcoming events preview */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Upcoming Events</h2>
          <span className="section-count">{events.length} upcoming</span>
        </div>

        {events.length === 0 ? (
          <div className="card dashboard-empty">
            <p>No upcoming events.</p>
          </div>
        ) : (
          <div className="events-list">
            {events.map((evt) => {
              const date = evt.date ? new Date(evt.date) : null;
              const day = date
                ? date.toLocaleDateString("en-GB", { day: "numeric" })
                : "—";
              const month = date
                ? date.toLocaleDateString("en-GB", { month: "short" }).toUpperCase()
                : "—";

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
                  </div>

                  <div className="event-status event-status--upcoming">
                    Upcoming
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}