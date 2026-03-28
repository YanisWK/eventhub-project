import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

export default function Participants() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadParticipants() {
      try {
        const data = await apiFetch("participants/");
        setParticipants(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadParticipants();
  }, []);

  if (loading) return <p>Loading participants...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h2>Participants</h2>
      {participants.length === 0 ? (
        <p>No participants found.</p>
      ) : (
        <ul>
          {participants.map((p) => (
            <li key={p.id}>
              {p.name} - {p.email}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}