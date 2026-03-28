import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

export default function Participants() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: ""
  });

  useEffect(() => {
    loadParticipants();
  }, []);

  async function loadParticipants() {
    try {
      setLoading(true);
      setError("");
      const data = await apiFetch("participants/");
      setParticipants(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError("");
    setCreating(true);

    try {
      const newParticipant = await apiFetch("participants/", {
        method: "POST",
        body: form
      });

      setParticipants((prev) => [newParticipant, ...prev]);
      setForm({ name: "", email: "" });
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return <p>Loading participants...</p>;
  }

  if (error) {
    return <p style={{ color: "red" }}>Error: {error}</p>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Participants</h1>

      <h2>Create participant</h2>

      <form onSubmit={handleCreate} style={{ marginBottom: "30px" }}>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <br /><br />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <br /><br />

        <button type="submit" disabled={creating}>
          {creating ? "Creating..." : "Create participant"}
        </button>
      </form>

      {createError && <p style={{ color: "red" }}>Create error: {createError}</p>}

      {participants.length === 0 ? (
        <p>No participants found.</p>
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