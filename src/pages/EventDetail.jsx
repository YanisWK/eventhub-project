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
          .filter((registration) => String(registration.event) === String(id))
          .map((registration) => registration.participant);

        const registeredParticipants = allParticipants.filter((participant) =>
          participantIds.includes(participant.id)
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

  if (loading) {
    return <p>Loading event details...</p>;
  }

  if (error) {
    return <p style={{ color: "red" }}>Error: {error}</p>;
  }

  if (!event) {
    return <p>Event not found.</p>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <Link to="/events">← Back to events</Link>

      <h1 style={{ marginTop: "20px" }}>{event.name}</h1>

      <p>{event.description || "No description available."}</p>

      <p>
        <strong>Date:</strong> {new Date(event.date).toLocaleString()}
      </p>

      <p>
        <strong>Status:</strong> {event.status}
      </p>

      <h2>Registered participants</h2>

      {participants.length === 0 ? (
        <p>No registered participants.</p>
      ) : (
        <ul>
          {participants.map((participant) => (
            <li key={participant.id}>
              {participant.name} - {participant.email}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}