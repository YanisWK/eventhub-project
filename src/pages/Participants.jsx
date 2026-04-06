import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { getUserRole, isAuthed } from "../store/authStore";
import "./Participants.css";

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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  const { isStaff, loadingRole } = useIsStaff();

  useEffect(() => {
    loadParticipants();
  }, []);

  async function loadParticipants() {
    try {
      setLoading(true);
      setError("");
      setParticipants(await apiFetch("participants/"));
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
        body: form,
      });

      setParticipants((prev) => [newParticipant, ...prev]);
      setForm({ name: "", email: "" });
      setShowCreateForm(false);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  function startEdit(participant) {
    setEditingId(participant.id);
    setEditForm({ name: participant.name, email: participant.email });
    setEditError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError("");
  }

  async function handleUpdate(id) {
    if (!isStaff) {
      setEditError("Only staff users can update participants.");
      return;
    }

    setEditError("");

    try {
      const updated = await apiFetch(`participants/${id}/`, {
        method: "PUT",
        body: editForm,
      });

      setParticipants((prev) =>
        prev.map((participant) => (participant.id === id ? updated : participant))
      );
      setEditingId(null);
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
    setDeleteError("");
  }

  async function confirmDelete() {
    if (!participantToDelete || !isStaff) return;

    try {
      await apiFetch(`participants/${participantToDelete.id}/`, {
        method: "DELETE",
      });

      setParticipants((prev) =>
        prev.filter((participant) => participant.id !== participantToDelete.id)
      );
      setParticipantToDelete(null);
    } catch (err) {
      setDeleteError(err.message);
    }
  }

  if (loadingRole) return <div className="loading">Loading permissions...</div>;
  if (loading) return <div className="loading">Loading participants...</div>;
  if (error)
    return (
      <div className="page">
        <div className="alert-error">{error}</div>
      </div>
    );

  return (
    <div className="page participants-page">
      <div className="section-header participants-header">
        <h1 className="page-title participants-title">Participants</h1>

        {isStaff && (
          <button
            className="btn-primary participants-toggle-btn"
            onClick={() => setShowCreateForm((prev) => !prev)}
          >
            {showCreateForm ? "Cancel" : "+ New Participant"}
          </button>
        )}
      </div>

      {!isStaff && (
        <div className="participants-readonly">
          Read-only — only organizers can create, edit or delete participants.
        </div>
      )}

      {isStaff && showCreateForm && (
        <div className="card participants-create-card">
          <h2 className="participants-section-title">New Participant</h2>

          {createError && (
            <div className="alert-error participants-alert-spacing">{createError}</div>
          )}

          <form onSubmit={handleCreate}>
            <div className="participants-form-grid">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  className="form-input"
                  type="text"
                  name="name"
                  placeholder="Full name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  name="email"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              className="btn-primary participants-submit-btn"
              type="submit"
              disabled={creating}
            >
              {creating ? "Creating..." : "Create Participant"}
            </button>
          </form>
        </div>
      )}

      {deleteError && (
        <div className="alert-error participants-alert-spacing">{deleteError}</div>
      )}

      {participants.length === 0 ? (
        <div className="card participants-empty">
          <div className="participants-empty-icon">👥</div>
          <p>No participants found.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                {isStaff && <th className="participants-actions-head">Actions</th>}
              </tr>
            </thead>

            <tbody>
              {participants.map((participant, index) => (
                <tr key={participant.id}>
                  {editingId === participant.id ? (
                    <td colSpan={isStaff ? 4 : 3}>
                      <div className="participants-edit-row">
                        <input
                          className="form-input participants-edit-name"
                          type="text"
                          name="name"
                          value={editForm.name}
                          onChange={handleEditChange}
                        />

                        <input
                          className="form-input participants-edit-email"
                          type="email"
                          name="email"
                          value={editForm.email}
                          onChange={handleEditChange}
                        />

                        {editError && (
                          <span className="participants-inline-error">{editError}</span>
                        )}

                        <button
                          className="btn-primary participants-small-btn"
                          onClick={() => handleUpdate(participant.id)}
                        >
                          Save
                        </button>

                        <button className="btn-secondary" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="participants-index">{index + 1}</td>
                      <td className="participants-name">{participant.name}</td>
                      <td className="participants-email">{participant.email}</td>

                      {isStaff && (
                        <td className="participants-actions-cell">
                          <div className="participants-actions">
                            <button
                              className="btn-secondary"
                              onClick={() => startEdit(participant)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn-danger"
                              onClick={() => openDeleteModal(participant)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {participantToDelete && (
        <div className="participants-modal-backdrop">
          <div className="card participants-modal">
            <h3 className="participants-modal-title">Confirm deletion</h3>

            <p className="participants-modal-text">
              Are you sure you want to delete{" "}
              <strong className="participants-modal-strong">
                {participantToDelete.name}
              </strong>
              ?
            </p>

            <p className="participants-modal-warning">
              This action cannot be undone.
            </p>

            {deleteError && (
              <div className="alert-error participants-alert-spacing">{deleteError}</div>
            )}

            <div className="participants-modal-actions">
              <button className="btn-secondary" onClick={closeDeleteModal}>
                Cancel
              </button>
              <button className="btn-danger" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}