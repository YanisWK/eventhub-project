import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "../api/client";

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEventDetail() {
      try {
        const [eventData, registrations, allParticipants] = await Promise.all([
          apiFetch(`events/${id}/`),
          apiFetch("registrations/"),
          apiFetch("participants/")
        ]);

        const participantIds = registrations
          .filter((r) => String(r.event) === String(id))
          .map((r) => r.participant);

        const registeredParticipants = allParticipants.filter((p) =>
          participantIds.includes(p.id)
        );

        setEvent(eventData);
        setParticipants(registeredParticipants);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadEventDetail();
  }, [id]);

  if (loading) return <p>Loading event details...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (!event) return <p>Event not found.</p>;

  return (
    <div style={{ padding: "20px" }}>
      <p><Link to="/events">← Back to events</Link></p>

      <h1>{event.name}</h1>
      <p>{event.description}</p>
      <p><strong>Date:</strong> {new Date(event.date).toLocaleString()}</p>
      <p><strong>Status:</strong> {event.status}</p>

      <h2>Registered participants</h2>

      {participants.length === 0 ? (
        <p>No registered participants.</p>
      ) : (
        <ul>
          {participants.map((p) => (
            <li key={p.id}>
              {p.name || `${p.first_name || ""} ${p.last_name || ""}`.trim() || `Participant #${p.id}`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}