import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import { getUserRole, isAuthed } from "../store/authStore";

function useIsStaff() {
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    async function loadRole() {
      if (!isAuthed()) {
        setIsStaff(false);
        return;
      }

      try {
        const role = await getUserRole();
        setIsStaff(role?.isStaff || false);
      } catch {
        setIsStaff(false);
      }
    }

    loadRole();
  }, []);

  return isStaff;
}

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

  const refreshEventDetail = useCallback(async () => {
    try {
      const [eventData, registrations, participantsData] = await Promise.all([
        apiFetch(`events/${id}/`),
        apiFetch("registrations/"),
        apiFetch("participants/")
      ]);

      const eventRegistrations = registrations.filter(
        (registration) => String(registration.event) === String(id)
      );

      const participantIds = eventRegistrations.map(
        (registration) => registration.participant
      );

      const registeredParticipants = participantsData.filter((participant) =>
        participantIds.includes(participant.id)
      );

      setEvent(eventData);
      setRegistrationsData(eventRegistrations);
      setAllParticipants(participantsData);
      setParticipants(registeredParticipants);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    async function loadEventDetail() {
      setLoading(true);
      await refreshEventDetail();
      setLoading(false);
    }

    loadEventDetail();
  }, [refreshEventDetail]);

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
        body: {
          event: Number(id),
          participant: Number(selectedParticipant)
        }
      });

      setSelectedParticipant("");
      await refreshEventDetail();
    } catch (err) {
      setRegisterError(err.message);
    } finally {
      setRegistering(false);
    }
  }

  async function handleRemoveParticipant(participantId) {
    setRemoveError("");

    const registration = registrationsData.find(
      (registration) => String(registration.participant) === String(participantId)
    );

    if (!registration) {
      setRemoveError("Registration not found.");
      return;
    }

    setRemovingId(participantId);

    try {
      await apiFetch(`registrations/${registration.id}/`, {
        method: "DELETE"
      });

      await refreshEventDetail();
    } catch (err) {
      setRemoveError(err.message);
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) return <p>Loading event details...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (!event) return <p>Event not found.</p>;

  const registeredIds = participants.map((participant) => participant.id);
  const availableParticipants = allParticipants.filter(
    (participant) => !registeredIds.includes(participant.id)
  );

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

      {isStaff && (
        <div style={{ marginTop: "30px", marginBottom: "30px" }}>
          <h2>Register a participant</h2>

          <form onSubmit={handleRegisterParticipant}>
            <select
              value={selectedParticipant}
              onChange={(e) => setSelectedParticipant(e.target.value)}
              style={{ marginRight: "10px", padding: "8px", minWidth: "260px" }}
            >
              <option value="">Select a participant</option>
              {availableParticipants.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.name} ({participant.email})
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={registering || availableParticipants.length === 0}
            >
              {registering ? "Registering..." : "Register participant"}
            </button>
          </form>

          {registerError && <p style={{ color: "red" }}>{registerError}</p>}

          {availableParticipants.length === 0 && (
            <p style={{ color: "#666" }}>
              All participants are already registered for this event.
            </p>
          )}
        </div>
      )}

      {removeError && <p style={{ color: "red" }}>{removeError}</p>}

      <h2>Registered participants</h2>

      {participants.length === 0 ? (
        <p>No registered participants.</p>
      ) : (
        <div>
          {participants.map((participant) => (
            <div
              key={participant.id}
              style={{
                border: "1px solid #ddd",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "10px"
              }}
            >
              <p style={{ margin: 0 }}>
                {participant.name} - {participant.email}
              </p>

              {isStaff && (
                <button
                  onClick={() => handleRemoveParticipant(participant.id)}
                  disabled={removingId === participant.id}
                  style={{
                    marginTop: "10px",
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    padding: "8px 12px",
                    borderRadius: "5px"
                  }}
                >
                  {removingId === participant.id ? "Removing..." : "Remove"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}