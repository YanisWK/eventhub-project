import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import { getUserRole, isAuthed } from "../store/authStore";

function useIsStaff() {
  const [isStaff, setIsStaff] = useState(false);
  useEffect(() => {
    async function loadRole() {
      if (!isAuthed()) { setIsStaff(false); return; }
      try {
        const role = await getUserRole();
        setIsStaff(role?.isStaff || false);
      } catch { setIsStaff(false); }
    }
    loadRole();
  }, []);
  return isStaff;
}

const STATUS_COLORS = {
  upcoming:  "badge-blue",
  ongoing:   "badge-cyan",
  finished:  "badge-green",
  cancelled: "badge-red",
};

export default function EventDetail() {
  const { id } = useParams();
  const isStaff = useIsStaff();

  const [event, setEvent]                       = useState(null);
  const [participants, setParticipants]         = useState([]);
  const [allParticipants, setAllParticipants]   = useState([]);
  const [registrationsData, setRegistrationsData] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState("");
  const [registerError, setRegisterError]       = useState("");
  const [removeError, setRemoveError]           = useState("");
  const [registering, setRegistering]           = useState(false);
  const [removingId, setRemovingId]             = useState(null);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState("");

  const refreshEventDetail = useCallback(async () => {
    try {
      const [eventData, registrations, participantsData] = await Promise.all([
        apiFetch(`events/${id}/`),
        apiFetch("registrations/"),
        apiFetch("participants/")
      ]);
      const eventRegs = registrations.filter(r => String(r.event) === String(id));
      const pIds = eventRegs.map(r => r.participant);
      setEvent(eventData);
      setRegistrationsData(eventRegs);
      setAllParticipants(participantsData);
      setParticipants(participantsData.filter(p => pIds.includes(p.id)));
      setError("");
    } catch (err) { setError(err.message); }
  }, [id]);

  useEffect(() => {
    async function load() { setLoading(true); await refreshEventDetail(); setLoading(false); }
    load();
  }, [refreshEventDetail]);

  async function handleRegisterParticipant(e) {
    e.preventDefault();
    if (!selectedParticipant) { setRegisterError("Please select a participant."); return; }
    setRegisterError(""); setRegistering(true);
    try {
      await apiFetch("registrations/", {
        method: "POST",
        body: { event: Number(id), participant: Number(selectedParticipant) }
      });
      setSelectedParticipant("");
      await refreshEventDetail();
    } catch (err) { setRegisterError(err.message); }
    finally { setRegistering(false); }
  }

  async function handleRemoveParticipant(participantId) {
    setRemoveError("");
    const registration = registrationsData.find(r => String(r.participant) === String(participantId));
    if (!registration) { setRemoveError("Registration not found."); return; }
    setRemovingId(participantId);
    try {
      await apiFetch(`registrations/${registration.id}/`, { method: "DELETE" });
      await refreshEventDetail();
    } catch (err) { setRemoveError(err.message); }
    finally { setRemovingId(null); }
  }

  if (loading) return <div className="loading">Loading event details...</div>;
  if (error)   return <div className="page"><div className="alert-error">{error}</div></div>;
  if (!event)  return <div className="page"><p style={{ color: "var(--text-muted)" }}>Event not found.</p></div>;

  const registeredIds = participants.map(p => p.id);
  const availableParticipants = allParticipants.filter(p => !registeredIds.includes(p.id));

  return (
    <div className="page">

      {/* Back link */}
      <Link to="/events" style={{ color: "var(--text-muted)", fontSize: "0.875rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "1.5rem" }}>
        ← Back to events
      </Link>

      {/* Event header */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>{event.name}</h1>
              <span className={`badge ${STATUS_COLORS[event.status] || "badge-blue"}`}>{event.status}</span>
            </div>
            <p style={{ color: "var(--text-muted)", marginBottom: "0.75rem", maxWidth: "60ch" }}>
              {event.description || "No description available."}
            </p>
            <p style={{ color: "var(--text-faint)", fontSize: "0.85rem", margin: 0 }}>
              📅 {new Date(event.date).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Register participant — staff only */}
      {isStaff && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--text)" }}>
            Register a participant
          </h2>
          <form onSubmit={handleRegisterParticipant} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: "220px" }}>
              <label className="form-label">Participant</label>
              <select className="form-input" value={selectedParticipant}
                onChange={e => setSelectedParticipant(e.target.value)}
                disabled={availableParticipants.length === 0}>
                <option value="">Select a participant</option>
                {availableParticipants.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                ))}
              </select>
            </div>
            <button className="btn-primary" type="submit"
              disabled={registering || availableParticipants.length === 0}
              style={{ width: "auto", padding: "9px 20px" }}>
              {registering ? "Registering..." : "Register"}
            </button>
          </form>
          {registerError && <div className="alert-error" style={{ marginTop: "0.75rem" }}>{registerError}</div>}
          {availableParticipants.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.75rem", margin: 0 }}>
              All participants are already registered for this event.
            </p>
          )}
        </div>
      )}

      {/* Registered participants */}
      <div className="section-header">
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>
          Registered participants
          <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)" }}>
            ({participants.length})
          </span>
        </h2>
      </div>

      {removeError && <div className="alert-error" style={{ marginBottom: "1rem" }}>{removeError}</div>}

      {participants.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>👤</div>
          <p>No registered participants yet.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                {isStaff && <th style={{ textAlign: "right" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {participants.map((p, i) => (
                <tr key={p.id}>
                  <td style={{ color: "var(--text-faint)", fontSize: "0.8rem" }}>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td style={{ color: "var(--text-muted)" }}>{p.email}</td>
                  {isStaff && (
                    <td style={{ textAlign: "right" }}>
                      <button className="btn-danger"
                        onClick={() => handleRemoveParticipant(p.id)}
                        disabled={removingId === p.id}>
                        {removingId === p.id ? "Removing..." : "Remove"}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}