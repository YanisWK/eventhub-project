import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import useIsStaff from "../hooks/useIsStaff";
import "./EventDetail.css";

const STATUS_COLORS = {
  upcoming: "badge-blue",
  ongoing: "badge-cyan",
  finished: "badge-green",
  cancelled: "badge-red",
};

export default function EventDetail() {
  const { id } = useParams();
  const isStaff = useIsStaff();

  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [allParticipants, setAllParticipants] = useState([]);
  const [registrationsData, setRegistrationsData] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [removeError, setRemoveError] = useState("");
  const [registering, setRegistering] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Loads the event details together with registrations and participant data
  const refreshEventDetail = useCallback(async () => {
    try {
      const [eventData, registrations, participantsData] = await Promise.all([
        apiFetch(`events/${id}/`),
        apiFetch("registrations/"),
        apiFetch("participants/"),
      ]);

      // Keep only the registrations linked to the current event
      const eventRegs = registrations.filter((registration) => String(registration.event) === String(id));
      const participantIds = eventRegs.map((registration) => registration.participant);

      setEvent(eventData);
      setRegistrationsData(eventRegs);
      setAllParticipants(participantsData);
      // list of participants registered
      setParticipants(participantsData.filter((participant) => participantIds.includes(participant.id)));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      await refreshEventDetail();
      setLoading(false);
    }

    load();
  }, [refreshEventDetail]);

  // Registers a selected participant to the current event
  async function handleRegisterParticipant(e) {
    e.preventDefault();

    if (!selectedParticipant) {
      setRegisterError("Please select a participant.");
      return;
    }

    setRegisterError("");
    setRegistering(true);

    try {
      await apiFetch("registrations/", {
        method: "POST",
        body: { event: Number(id), participant: Number(selectedParticipant) },
      });

      setSelectedParticipant("");
      await refreshEventDetail();
    } catch (err) {
      setRegisterError(err.message);
    } finally {
      setRegistering(false);
    }
  }

  // Removes a participant from the event : delete the matching registration
  async function handleRemoveParticipant(participantId) {
    setRemoveError("");

    const registration = registrationsData.find(
      (item) => String(item.participant) === String(participantId)
    );

    if (!registration) {
      setRemoveError("Registration not found.");
      return;
    }

    setRemovingId(participantId);

    try {
      await apiFetch(`registrations/${registration.id}/`, { method: "DELETE" });
      await refreshEventDetail();
    } catch (err) {
      setRemoveError(err.message);
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) return <div className="loading">Loading event details...</div>;
  if (error)
    return (
      <div className="page">
        <div className="alert-error">{error}</div>
      </div>
    );

  // Fallback state if the event doesn't exist
  if (!event)
    return (
      <div className="page">
        <p className="event-detail-not-found">Event not found.</p>
      </div>
    );

  // Only participants not yet registered are shown
  const registeredIds = participants.map((participant) => participant.id);
  const availableParticipants = allParticipants.filter(
    (participant) => !registeredIds.includes(participant.id)
  );

  return (
    <div className="page event-detail-page">
      <Link to="/events" className="event-detail-back-link">
        ← Back to events
      </Link>

      <div className="card event-detail-header-card">
        <div className="event-detail-header-row">
          <div>
            <div className="event-detail-title-row">
              <h1 className="event-detail-title">{event.name}</h1>
              <span className={`badge ${STATUS_COLORS[event.status] || "badge-blue"}`}>
                {event.status}
              </span>
            </div>

            <p className="event-detail-description">
              {event.description || "No description available."}
            </p>

            <p className="event-detail-date">
              {new Date(event.date).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Staffs can manage event registrations */}
      {isStaff && (
        <div className="card event-detail-register-card">
          <h2 className="event-detail-section-title">Register a participant</h2>

          <form className="event-detail-register-form" onSubmit={handleRegisterParticipant}>
            <div className="form-group event-detail-register-group">
              <label className="form-label">Participant</label>
              <select
                className="form-input"
                value={selectedParticipant}
                onChange={(e) => setSelectedParticipant(e.target.value)}
                disabled={availableParticipants.length === 0}
              >
                <option value="">Select a participant</option>
                {availableParticipants.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.name} ({participant.email})
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn-primary event-detail-register-btn"
              type="submit"
              disabled={registering || availableParticipants.length === 0}
            >
              {registering ? "Registering..." : "Register"}
            </button>
          </form>

          {registerError && (
            <div className="alert-error event-detail-top-gap">{registerError}</div>
          )}

          {availableParticipants.length === 0 && (
            <p className="event-detail-help-text">
              All participants are already registered for this event.
            </p>
          )}
        </div>
      )}

      <div className="section-header event-detail-section-header">
        <h2 className="event-detail-section-title event-detail-participants-title">
          Registered participants
          <span className="event-detail-count">({participants.length})</span>
        </h2>
      </div>

      {removeError && (
        <div className="alert-error event-detail-alert-spacing">{removeError}</div>
      )}

      {participants.length === 0 ? (
        <div className="card event-detail-empty">
          <div className="event-detail-empty-icon">👤</div>
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
                {isStaff && <th className="event-detail-actions-head">Actions</th>}
              </tr>
            </thead>

            <tbody>
              {participants.map((participant, index) => (
                <tr key={participant.id}>
                  <td className="event-detail-index">{index + 1}</td>
                  <td className="event-detail-name">{participant.name}</td>
                  <td className="event-detail-email">{participant.email}</td>

                  {isStaff && (
                    <td className="event-detail-actions-cell">
                      <button
                        className="btn-danger"
                        onClick={() => handleRemoveParticipant(participant.id)}
                        disabled={removingId === participant.id}
                      >
                        {removingId === participant.id ? "Removing..." : "Remove"}
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