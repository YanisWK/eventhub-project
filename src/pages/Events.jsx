import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import { getUserRole, isAuthed } from "../store/authStore";

function useIsStaff() {
  const [isStaff, setIsStaff] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!isAuthed()) {
        setIsStaff(false);
        setLoading(false);
        return;
      }
      try {
        const role = await getUserRole();
        setIsStaff(role?.isStaff || false);
      } catch {
        setIsStaff(false);
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, []);

  return { isStaff, loading };
}

export default function Events() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
  const [editError, setEditError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [eventToDelete, setEventToDelete] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    date: "",
    status: "upcoming"
  });

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    date: "",
    status: "upcoming"
  });

  const { isStaff, loading: roleLoading } = useIsStaff();

  async function loadEvents(filters = {}) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.date) params.append("date", filters.date);
      const query = params.toString() ? `events/?${params.toString()}` : "events/";
      const data = await apiFetch(query);
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  function handleFilterSubmit(e) {
    e.preventDefault();
    loadEvents({ status, date });
  }

  function handleReset() {
    setStatus("");
    setDate("");
    loadEvents({});
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
      setCreateError("Only staff users can create events.");
      return;
    }

    setCreateError("");
    setCreating(true);

    try {
      const newEvent = await apiFetch("events/", {
        method: "POST",
        body: form
      });
      setEvents((prev) => [newEvent, ...prev]);
      setForm({ name: "", description: "", date: "", status: "upcoming" });
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  function startEdit(event) {
    setEditingId(event.id);
    setEditForm({
      name: event.name,
      description: event.description || "",
      date: event.date ? event.date.slice(0, 16) : "",
      status: event.status
    });
    setEditError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({
      name: "",
      description: "",
      date: "",
      status: "upcoming"
    });
  }

  async function handleUpdate(id) {
    if (!isStaff) {
      setEditError("Only staff users can update events.");
      return;
    }

    try {
      const updatedEvent = await apiFetch(`events/${id}/`, {
        method: "PUT",
        body: editForm
      });

      setEvents((prev) =>
        prev.map((event) => (event.id === id ? updatedEvent : event))
      );
      setEditingId(null);
    } catch (err) {
      setEditError(err.message);
    }
  }

  function openDeleteModal(event) {
    setEventToDelete(event);
    setDeleteError("");
  }

  function closeDeleteModal() {
    setEventToDelete(null);
  }

  async function confirmDelete() {
    if (!eventToDelete) return;

    try {
      await apiFetch(`events/${eventToDelete.id}/`, {
        method: "DELETE"
      });

      setEvents((prev) =>
        prev.filter((event) => event.id !== eventToDelete.id)
      );
      setEventToDelete(null);
    } catch (err) {
      setDeleteError(err.message);
    }
  }

  if (roleLoading) return <div>Loading permissions...</div>;
  if (loading) return <div>Loading events...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="events-page" style={{ padding: "20px" }}>
      <h1>Events</h1>

      <form onSubmit={handleFilterSubmit} style={{ marginBottom: "20px" }}>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ marginRight: "10px" }}>
          <option value="">All statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="finished">Finished</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ marginRight: "10px" }} />
        <button type="submit">Filter</button>
        <button type="button" onClick={handleReset} style={{ marginLeft: "10px" }}>
          Reset
        </button>
      </form>

      {isStaff ? (
        <form onSubmit={handleCreate} style={{ marginBottom: "30px" }}>
          <h2>Create Event</h2>
          {createError && <div style={{ color: "red" }}>Error: {createError}</div>}
          <input name="name" placeholder="Event name" value={form.name} onChange={handleChange} required style={{ display: "block", marginBottom: "10px", padding: "8px", width: "300px" }} />
          <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} style={{ display: "block", marginBottom: "10px", padding: "8px", width: "300px" }} />
          <input name="date" type="datetime-local" value={form.date} onChange={handleChange} required style={{ display: "block", marginBottom: "10px", padding: "8px", width: "300px" }} />
          <select name="status" value={form.status} onChange={handleChange} style={{ display: "block", marginBottom: "10px", padding: "8px", width: "300px" }}>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="finished">Finished</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create Event"}
          </button>
        </form>
      ) : (
        <p style={{ color: "#666", fontStyle: "italic", padding: "15px", background: "#f8f9fa", borderRadius: "5px" }}>
          Read-only - Only organizers can create, edit, or delete events.
        </p>
      )}

      {deleteError && <p style={{ color: "red" }}>Delete error: {deleteError}</p>}

      {events.length === 0 ? (
        <p>No events found.</p>
      ) : (
        <div className="events-list">
          {events.map((event) => (
            <div
              key={event.id}
              style={{
                border: "1px solid #ddd",
                padding: "20px",
                marginBottom: "15px",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}
            >
              {editingId === event.id ? (
                <>
                  <input name="name" value={editForm.name} onChange={handleEditChange} style={{ display: "block", marginBottom: "10px", padding: "8px", width: "300px" }} />
                  <textarea name="description" value={editForm.description} onChange={handleEditChange} style={{ display: "block", marginBottom: "10px", padding: "8px", width: "300px" }} />
                  <input name="date" type="datetime-local" value={editForm.date} onChange={handleEditChange} style={{ display: "block", marginBottom: "10px", padding: "8px", width: "300px" }} />
                  <select name="status" value={editForm.status} onChange={handleEditChange} style={{ display: "block", marginBottom: "10px", padding: "8px", width: "300px" }}>
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="finished">Finished</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  {editError && <p style={{ color: "red" }}>Update error: {editError}</p>}
                  <button onClick={() => handleUpdate(event.id)} style={{ marginRight: "10px" }}>Save</button>
                  <button onClick={cancelEdit}>Cancel</button>
                </>
              ) : (
                <>
                  <h3 style={{ marginTop: 0 }}>
                    <Link to={`/events/${event.id}`} style={{ color: "#007bff", textDecoration: "none" }}>
                      {event.name}
                    </Link>
                  </h3>
                  <p>{event.description}</p>
                  <p><strong>Date:</strong> {new Date(event.date).toLocaleString()}</p>
                  <span style={{ padding: "6px 12px", background: "#e9ecef", borderRadius: "20px", fontSize: "0.85em", fontWeight: "bold" }}>
                    {event.status}
                  </span>

                  {isStaff && (
                    <div style={{ marginTop: "15px" }}>
                      <button onClick={() => startEdit(event)} style={{ marginRight: "10px" }}>
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(event)}
                        style={{ background: "#dc3545", color: "white", border: "none", padding: "8px 12px", borderRadius: "5px" }}
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

      {eventToDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "24px", borderRadius: "10px", width: "400px", maxWidth: "90%" }}>
            <h3 style={{ marginTop: 0 }}>Confirm deletion</h3>
            <p>Are you sure you want to delete <strong>{eventToDelete.name}</strong>?</p>
            <p style={{ color: "#666" }}>This action cannot be undone.</p>
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={closeDeleteModal}>Cancel</button>
              <button onClick={confirmDelete} style={{ background: "#dc3545", color: "white", border: "none", padding: "8px 14px", borderRadius: "5px" }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}