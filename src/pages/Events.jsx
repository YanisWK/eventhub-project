import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadEvents(filters = {}) {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (filters.status) params.append("status", filters.status);
      if (filters.date) params.append("date", filters.date);

      const query = params.toString() ? `events/?${params.toString()}` : "events/";
      const data = await apiFetch(query);
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    loadEvents({ status, date });
  }

  function handleReset() {
    setStatus("");
    setDate("");
    loadEvents({});
  }

  if (loading) return <p>Loading events...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Events</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ marginRight: "10px" }}
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ marginRight: "10px" }}
        >
          <option value="">All statuses</option>
          <option value="upcoming">upcoming</option>
          <option value="completed">completed</option>
          <option value="cancelled">cancelled</option>
        </select>

        <button type="submit" style={{ marginRight: "10px" }}>Filter</button>
        <button type="button" onClick={handleReset}>Reset</button>
      </form>

      {events.length === 0 ? (
        <p>No events found.</p>
      ) : (
        <ul>
          {events.map((event) => (
            <li key={event.id} style={{ marginBottom: "12px" }}>
              <Link to={`/events/${event.id}`}><strong>{event.name}</strong></Link>
              <div>{event.description}</div>
              <div>Date: {new Date(event.date).toLocaleString()}</div>
              <div>Status: {event.status}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}