import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import { getUserRole, isAuthed } from "../store/authStore";

function useIsStaff() {
  const [isStaff, setIsStaff] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchRole = async () => {
      if (!isAuthed()) { setIsStaff(false); setLoading(false); return; }
      try {
        const role = await getUserRole();
        setIsStaff(role?.isStaff || false);
      } catch { setIsStaff(false); }
      finally { setLoading(false); }
    };
    fetchRole();
  }, []);
  return { isStaff, loading };
}

const STATUS_COLORS = {
  upcoming:  "badge-blue",
  ongoing:   "badge-cyan",
  finished:  "badge-green",
  cancelled: "badge-red",
};

export default function Events() {
  const [events, setEvents]           = useState([]);
  const [status, setStatus]           = useState("");
  const [date, setDate]               = useState("");
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [createError, setCreateError] = useState("");
  const [editError, setEditError]     = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [creating, setCreating]       = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [form, setForm] = useState({ name: "", description: "", date: "", status: "upcoming" });
  const [editForm, setEditForm] = useState({ name: "", description: "", date: "", status: "upcoming" });

  const { isStaff, loading: roleLoading } = useIsStaff();

  async function loadEvents(filters = {}) {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.date)   params.append("date", filters.date);
      const query = params.toString() ? `events/?${params.toString()}` : "events/";
      setEvents(await apiFetch(query));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadEvents(); }, []);

  function handleFilterSubmit(e) { e.preventDefault(); loadEvents({ status, date }); }
  function handleReset() { setStatus(""); setDate(""); loadEvents({}); }
  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }
  function handleEditChange(e) { setEditForm({ ...editForm, [e.target.name]: e.target.value }); }

  async function handleCreate(e) {
    e.preventDefault();
    if (!isStaff) { setCreateError("Only staff users can create events."); return; }
    setCreateError(""); setCreating(true);
    try {
      const newEvent = await apiFetch("events/", { method: "POST", body: form });
      setEvents(prev => [newEvent, ...prev]);
      setForm({ name: "", description: "", date: "", status: "upcoming" });
      setShowCreateForm(false);
    } catch (err) { setCreateError(err.message); }
    finally { setCreating(false); }
  }

  function startEdit(event) {
    setEditingId(event.id);
    setEditForm({ name: event.name, description: event.description || "", date: event.date ? event.date.slice(0, 16) : "", status: event.status });
    setEditError("");
  }
  function cancelEdit() { setEditingId(null); setEditError(""); }

  async function handleUpdate(id) {
    if (!isStaff) { setEditError("Only staff users can update events."); return; }
    try {
      const updated = await apiFetch(`events/${id}/`, { method: "PUT", body: editForm });
      setEvents(prev => prev.map(e => e.id === id ? updated : e));
      setEditingId(null);
    } catch (err) { setEditError(err.message); }
  }

  function openDeleteModal(event) { setEventToDelete(event); setDeleteError(""); }
  function closeDeleteModal() { setEventToDelete(null); }

  async function confirmDelete() {
    if (!eventToDelete) return;
    try {
      await apiFetch(`events/${eventToDelete.id}/`, { method: "DELETE" });
      setEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
      setEventToDelete(null);
    } catch (err) { setDeleteError(err.message); }
  }

  if (roleLoading) return <div className="loading">Loading permissions...</div>;
  if (loading)     return <div className="loading">Loading events...</div>;
  if (error)       return <div className="page"><div className="alert-error">{error}</div></div>;

  return (
    <div className="page">
      {/* Header */}
      <div className="section-header">
        <h1 className="page-title" style={{ marginBottom: 0 }}>Events</h1>
        {isStaff && (
          <button className="btn-primary" style={{ width: "auto", padding: "8px 20px" }}
            onClick={() => setShowCreateForm(v => !v)}>
            {showCreateForm ? "Cancel" : "+ New Event"}
          </button>
        )}
      </div>

      {/* Read-only notice */}
      {!isStaff && (
        <div style={{ padding: "10px 14px", background: "rgba(26,143,227,0.07)", border: "1px solid rgba(26,143,227,0.15)", borderRadius: "8px", color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
          Read-only — only organizers can create, edit or delete events.
        </div>
      )}

      {/* Create form */}
      {isStaff && showCreateForm && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--text)" }}>Create Event</h2>
          {createError && <div className="alert-error" style={{ marginBottom: "1rem" }}>{createError}</div>}
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Event name</label>
              <input className="form-input" name="name" placeholder="Enter event name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" name="description" placeholder="Description" value={form.description} onChange={handleChange}
                style={{ resize: "vertical", minHeight: "80px" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Date & Time</label>
                <input className="form-input" name="date" type="datetime-local" value={form.date} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" name="status" value={form.status} onChange={handleChange}>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="finished">Finished</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <button className="btn-primary" type="submit" disabled={creating} style={{ width: "auto", padding: "9px 24px" }}>
              {creating ? "Creating..." : "Create Event"}
            </button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <form onSubmit={handleFilterSubmit} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Status</label>
            <select className="form-input" style={{ minWidth: "150px" }} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="finished">Finished</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <button className="btn-secondary" type="submit">Filter</button>
          <button className="btn-secondary" type="button" onClick={handleReset}>Reset</button>
        </form>
      </div>

      {/* Delete error */}
      {deleteError && <div className="alert-error" style={{ marginBottom: "1rem" }}>{deleteError}</div>}

      {/* Events list */}
      {events.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📭</div>
          <p>No events found.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {events.map(event => (
            <div className="card" key={event.id}>
              {editingId === event.id ? (
                <div>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text)" }}>Edit Event</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="form-group">
                      <label className="form-label">Name</label>
                      <input className="form-input" name="name" value={editForm.name} onChange={handleEditChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Date & Time</label>
                      <input className="form-input" name="date" type="datetime-local" value={editForm.date} onChange={handleEditChange} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea className="form-input" name="description" value={editForm.description} onChange={handleEditChange}
                      style={{ resize: "vertical", minHeight: "70px" }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-input" style={{ maxWidth: "200px" }} name="status" value={editForm.status} onChange={handleEditChange}>
                      <option value="upcoming">Upcoming</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="finished">Finished</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  {editError && <div className="alert-error" style={{ marginBottom: "1rem" }}>{editError}</div>}
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button className="btn-primary" style={{ width: "auto", padding: "8px 20px" }} onClick={() => handleUpdate(event.id)}>Save</button>
                    <button className="btn-secondary" onClick={cancelEdit}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                      <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
                        <Link to={`/events/${event.id}`} style={{ color: "var(--primary)", textDecoration: "none" }}>
                          {event.name}
                        </Link>
                      </h3>
                      <span className={`badge ${STATUS_COLORS[event.status] || "badge-blue"}`}>{event.status}</span>
                    </div>
                    {event.description && <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: "0 0 0.5rem" }}>{event.description}</p>}
                    <p style={{ color: "var(--text-faint)", fontSize: "0.8rem", margin: 0 }}>
                      📅 {new Date(event.date).toLocaleString()}
                    </p>
                  </div>
                  {isStaff && (
                    <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                      <button className="btn-secondary" onClick={() => startEdit(event)}>Edit</button>
                      <button className="btn-danger" onClick={() => openDeleteModal(event)}>Delete</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete modal */}
      {eventToDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
          <div className="card" style={{ width: "400px", maxWidth: "90%", padding: "2rem" }}>
            <h3 style={{ marginTop: 0, marginBottom: "0.75rem", color: "var(--text)" }}>Confirm deletion</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: "0.5rem" }}>
              Are you sure you want to delete <strong style={{ color: "var(--text)" }}>{eventToDelete.name}</strong>?
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