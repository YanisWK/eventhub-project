import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { getUserRole, isAuthed } from "../store/authStore";

function useIsStaff() {
  const [isStaff, setIsStaff] = useState(false);
  const [loadingRole, setLoadingRole] = useState(true);
  useEffect(() => {
    const fetchRole = async () => {
      if (!isAuthed()) { setIsStaff(false); setLoadingRole(false); return; }
      try {
        const role = await getUserRole();
        setIsStaff(role?.isStaff || false);
      } catch { setIsStaff(false); }
      finally { setLoadingRole(false); }
    };
    fetchRole();
  }, []);
  return { isStaff, loadingRole };
}

export default function Participants() {
  const [participants, setParticipants]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [createError, setCreateError]     = useState("");
  const [creating, setCreating]           = useState(false);
  const [editingId, setEditingId]         = useState(null);
  const [editError, setEditError]         = useState("");
  const [deleteError, setDeleteError]     = useState("");
  const [participantToDelete, setParticipantToDelete] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm]         = useState({ name: "", email: "" });
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  const { isStaff, loadingRole } = useIsStaff();

  useEffect(() => { loadParticipants(); }, []);

  async function loadParticipants() {
    try {
      setLoading(true); setError("");
      setParticipants(await apiFetch("participants/"));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }
  function handleEditChange(e) { setEditForm({ ...editForm, [e.target.name]: e.target.value }); }

  async function handleCreate(e) {
    e.preventDefault();
    if (!isStaff) { setCreateError("Only staff users can create participants."); return; }
    setCreateError(""); setCreating(true);
    try {
      const newP = await apiFetch("participants/", { method: "POST", body: form });
      setParticipants(prev => [newP, ...prev]);
      setForm({ name: "", email: "" });
      setShowCreateForm(false);
    } catch (err) { setCreateError(err.message); }
    finally { setCreating(false); }
  }

  function startEdit(p) { setEditingId(p.id); setEditForm({ name: p.name, email: p.email }); setEditError(""); }
  function cancelEdit() { setEditingId(null); setEditError(""); }

  async function handleUpdate(id) {
    if (!isStaff) { setEditError("Only staff users can update participants."); return; }
    setEditError("");
    try {
      const updated = await apiFetch(`participants/${id}/`, { method: "PUT", body: editForm });
      setParticipants(prev => prev.map(p => p.id === id ? updated : p));
      setEditingId(null);
    } catch (err) { setEditError(err.message); }
  }

  function openDeleteModal(p) { setParticipantToDelete(p); setDeleteError(""); }
  function closeDeleteModal() { setParticipantToDelete(null); }

  async function confirmDelete() {
    if (!participantToDelete || !isStaff) return;
    try {
      await apiFetch(`participants/${participantToDelete.id}/`, { method: "DELETE" });
      setParticipants(prev => prev.filter(p => p.id !== participantToDelete.id));
      setParticipantToDelete(null);
    } catch (err) { setDeleteError(err.message); }
  }

  if (loadingRole) return <div className="loading">Loading permissions...</div>;
  if (loading)     return <div className="loading">Loading participants...</div>;
  if (error)       return <div className="page"><div className="alert-error">{error}</div></div>;

  return (
    <div className="page">
      {/* Header */}
      <div className="section-header">
        <h1 className="page-title" style={{ marginBottom: 0 }}>Participants</h1>
        {isStaff && (
          <button className="btn-primary" style={{ width: "auto", padding: "8px 20px" }}
            onClick={() => setShowCreateForm(v => !v)}>
            {showCreateForm ? "Cancel" : "+ New Participant"}
          </button>
        )}
      </div>

      {/* Read-only notice */}
      {!isStaff && (
        <div style={{ padding: "10px 14px", background: "rgba(26,143,227,0.07)", border: "1px solid rgba(26,143,227,0.15)", borderRadius: "8px", color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
          Read-only — only organizers can create, edit or delete participants.
        </div>
      )}

      {/* Create form */}
      {isStaff && showCreateForm && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--text)" }}>New Participant</h2>
          {createError && <div className="alert-error" style={{ marginBottom: "1rem" }}>{createError}</div>}
          <form onSubmit={handleCreate}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" type="text" name="name" placeholder="Full name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" name="email" placeholder="email@example.com" value={form.email} onChange={handleChange} required />
              </div>
            </div>
            <button className="btn-primary" type="submit" disabled={creating} style={{ width: "auto", padding: "9px 24px" }}>
              {creating ? "Creating..." : "Create Participant"}
            </button>
          </form>
        </div>
      )}

      {deleteError && <div className="alert-error" style={{ marginBottom: "1rem" }}>{deleteError}</div>}

      {/* Participants table */}
      {participants.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>👥</div>
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
                {isStaff && <th style={{ textAlign: "right" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {participants.map((p, i) => (
                <tr key={p.id}>
                  {editingId === p.id ? (
                    <td colSpan={isStaff ? 4 : 3}>
                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                        <input className="form-input" style={{ maxWidth: "200px" }} type="text" name="name" value={editForm.name} onChange={handleEditChange} />
                        <input className="form-input" style={{ maxWidth: "240px" }} type="email" name="email" value={editForm.email} onChange={handleEditChange} />
                        {editError && <span style={{ color: "var(--error)", fontSize: "0.8rem" }}>{editError}</span>}
                        <button className="btn-primary" style={{ width: "auto", padding: "7px 16px" }} onClick={() => handleUpdate(p.id)}>Save</button>
                        <button className="btn-secondary" onClick={cancelEdit}>Cancel</button>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td style={{ color: "var(--text-faint)", fontSize: "0.8rem" }}>{i + 1}</td>
                      <td style={{ fontWeight: 500 }}>{p.name}</td>
                      <td style={{ color: "var(--text-muted)" }}>{p.email}</td>
                      {isStaff && (
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                            <button className="btn-secondary" onClick={() => startEdit(p)}>Edit</button>
                            <button className="btn-danger" onClick={() => openDeleteModal(p)}>Delete</button>
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

      {/* Delete modal */}
      {participantToDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
          <div className="card" style={{ width: "400px", maxWidth: "90%", padding: "2rem" }}>
            <h3 style={{ marginTop: 0, marginBottom: "0.75rem" }}>Confirm deletion</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: "0.5rem" }}>
              Are you sure you want to delete <strong style={{ color: "var(--text)" }}>{participantToDelete.name}</strong>?
            </p>
            <p style={{ color: "var(--text-faint)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>This action cannot be undone.</p>
            {deleteError && <div className="alert-error" style={{ marginBottom: "1rem" }}>{deleteError}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button className="btn-secondary" onClick={closeDeleteModal}>Cancel</button>
              <button className="btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}