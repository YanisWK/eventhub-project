import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { getUserRole, isAuthed } from "../store/authStore";

function useIsStaff() {
  const [isStaff, setIsStaff] = useState(false);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!isAuthed()) {
        setIsStaff(false);
        setLoadingRole(false);
        return;
      }

      try {
        const role = await getUserRole();
        setIsStaff(role?.isStaff || false);
      } catch {
        setIsStaff(false);
      } finally {
        setLoadingRole(false);
      }
    };

    fetchRole();
  }, []);

  return { isStaff, loadingRole };
}

export default function Participants() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editError, setEditError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [participantToDelete, setParticipantToDelete] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: ""
  });

  const [editForm, setEditForm] = useState({
    name: "",
    email: ""
  });

  const { isStaff, loadingRole } = useIsStaff();

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

  function handleEditChange(e) {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  }

  async function handleCreate(e) {
    e.preventDefault();

    if (!isStaff) {
      setCreateError("Only staff users can create participants.");
      return;
    }

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

  function startEdit(participant) {
    setEditingId(participant.id);
    setEditForm({
      name: participant.name,
      email: participant.email
    });
    setEditError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ name: "", email: "" });
    setEditError("");
  }

  async function handleUpdate(id) {
    if (!isStaff) {
      setEditError("Only staff users can update participants.");
      return;
    }

    setEditError("");

    try {
      const updatedParticipant = await apiFetch(`participants/${id}/`, {
        method: "PUT",
        body: editForm
      });

      setParticipants((prev) =>
        prev.map((participant) =>
          participant.id === id ? updatedParticipant : participant
        )
      );

      setEditingId(null);
      setEditForm({ name: "", email: "" });
    } catch (err) {
      setEditError(err.message);
    }
  }

  function openDeleteModal(participant) {
    setParticipantToDelete(participant);
    setDeleteError("");
  }

  function closeDeleteModal() {
    setParticipantToDelete(null);
  }

  async function confirmDelete() {
    if (!participantToDelete) return;

    if (!isStaff) {
      setDeleteError("Only staff users can delete participants.");
      return;
    }

    try {
      await apiFetch(`participants/${participantToDelete.id}/`, {
        method: "DELETE"
      });

      setParticipants((prev) =>
        prev.filter((participant) => participant.id !== participantToDelete.id)
      );

      setParticipantToDelete(null);
    } catch (err) {
      setDeleteError(err.message);
    }
  }

  if (loadingRole) {
    return <p>Loading permissions...</p>;
  }

  if (loading) {
    return <p>Loading participants...</p>;
  }

  if (error) {
    return <p style={{ color: "red" }}>Error: {error}</p>;
  }

  return (
    <div style={{ padding: "20px", position: "relative" }}>
      <h1>Participants</h1>

      {isStaff ? (
        <>
          <h2>Create participant</h2>

          <form onSubmit={handleCreate} style={{ marginBottom: "30px" }}>
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              required
              style={{
                display: "block",
                marginBottom: "10px",
                padding: "8px",
                width: "300px"
              }}
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              style={{
                display: "block",
                marginBottom: "10px",
                padding: "8px",
                width: "300px"
              }}
            />

            <button type="submit" disabled={creating}>
              {creating ? "Creating..." : "Create participant"}
            </button>
          </form>

          {createError && <p style={{ color: "red" }}>Create error: {createError}</p>}
        </>
      ) : (
        <p
          style={{
            color: "#666",
            fontStyle: "italic",
            padding: "15px",
            background: "#f8f9fa",
            borderRadius: "5px"
          }}
        >
          Read-only - Only organizers can create, edit, or delete participants.
        </p>
      )}

      {deleteError && <p style={{ color: "red" }}>Delete error: {deleteError}</p>}

      {participants.length === 0 ? (
        <p>No participants found.</p>
      ) : (
        <div>
          {participants.map((participant) => (
            <div
              key={participant.id}
              style={{
                border: "1px solid #ddd",
                padding: "15px",
                marginBottom: "12px",
                borderRadius: "8px"
              }}
            >
              {editingId === participant.id ? (
                <>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    style={{
                      display: "block",
                      marginBottom: "10px",
                      padding: "8px",
                      width: "300px"
                    }}
                  />
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditChange}
                    style={{
                      display: "block",
                      marginBottom: "10px",
                      padding: "8px",
                      width: "300px"
                    }}
                  />
                  {editError && <p style={{ color: "red" }}>Update error: {editError}</p>}
                  <button onClick={() => handleUpdate(participant.id)} style={{ marginRight: "10px" }}>
                    Save
                  </button>
                  <button onClick={cancelEdit}>Cancel</button>
                </>
              ) : (
                <>
                  <p><strong>Name:</strong> {participant.name}</p>
                  <p><strong>Email:</strong> {participant.email}</p>

                  {isStaff && (
                    <div>
                      <button
                        onClick={() => startEdit(participant)}
                        style={{ marginRight: "10px" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(participant)}
                        style={{
                          background: "#dc3545",
                          color: "white",
                          border: "none",
                          padding: "8px 12px",
                          borderRadius: "5px"
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {participantToDelete && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
        >
          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "10px",
              width: "400px",
              maxWidth: "90%",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
            }}
          >
            <h3 style={{ marginTop: 0 }}>Confirm deletion</h3>
            <p>
              Are you sure you want to delete <strong>{participantToDelete.name}</strong>?
            </p>
            <p style={{ color: "#666", fontSize: "0.95em" }}>
              This action cannot be undone.
            </p>

            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={closeDeleteModal}>
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  background: "#dc3545",
                  color: "white",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: "5px"
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}