import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

export default function Dashboard() {
  const [stats, setStats] = useState({
    events: 0,
    participants: 0,
    registrations: 0
  });
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

        setStats({
          events: events.length,
          participants: participants.length,
          registrations: registrations.length
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Total events: {stats.events}</p>
      <p>Total participants: {stats.participants}</p>
      <p>Total registrations: {stats.registrations}</p>
    </div>
  );
}