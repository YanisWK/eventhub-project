import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import { getUserRole, isAuthed } from "../store/authStore";
import "./Events.css";

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

const STATUS_COLORS = {
  upcoming: "badge-blue",
  ongoing: "badge-cyan",
  finished: "badge-green",
  cancelled: "badge-red",
};

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
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    date: "",
    status: "upcoming",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    date: "",
    status: "upcoming",
  });

  const { isStaff, loading: roleLoading } = useIsStaff();

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents(filters = {}) {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.date) params.append("date", filters.date);

      const query = params.toString() ? `events/?${params.toString()}` : "events/";
      setEvents(await apiFetch(query));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

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
        body: form,
      });

      setEvents((prev) => [newEvent, ...prev]);
      setForm({ name: "", description: "", date: "", status: "upcoming" });
      setShowCreateForm(false);
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
      status: event.status,
    });
    setEditError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError("");
  }

  async function handleUpdate(id) {
    if (!isStaff) {
      setEditError("Only staff users can update events.");
      return;
    }

    try {
      const updated = await apiFetch(`events/${id}/`, {
        method: "PUT",
        body: editForm,
      });

      setEvents((prev) => prev.map((event) => (event.id === id ? updated : event)));
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
      await apiFetch(`events/${eventToDelete.id}/`, { method: "DELETE" });
      setEvents((prev) => prev.filter((event) => event.id !== eventToDelete.id));
      setEventToDelete(null);
    } catch (err) {
      setDeleteError(err.message);
    }
  }

  if (roleLoading) return <div className="loading">Loading permissions...</div>;
  if (loading) return <div className="loading">Loading events...</div>;
  if (error)
    return (
      <div className="page">
        <div className="alert-error">{error}</div>
      </div>
    );

  return (
    <div className="page events-page">
      <div className="section-header events-header">
        <h1 className="page-title events-title">Events</h1>

        {isStaff && (
          <button
            className="btn-primary events-toggle-btn"
            onClick={() => setShowCreateForm((prev) => !prev)}
          >
            {showCreateForm ? "Cancel" : "+ New Event"}
          </button>
        )}
      </div>

      {!isStaff && (
        <div className="events-readonly">
          Read-only
        </div>
      )}

      {isStaff && showCreateForm && (
        <div className="card events-create-card">
          <h2 className="events-section-title">Create Event</h2>

          {createError && <div className="alert-error events-alert">{createError}</div>}

          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Event name</label>
              <input
                className="form-input"
                name="name"
                placeholder="Enter event name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input events-textarea"
                name="description"
                placeholder="Description"
                value={form.description}
                onChange={handleChange}
              />
            </div>

            <div className="events-grid-two">
              <div className="form-group">
                <label className="form-label">Date & Time</label>
                <input
                  className="form-input"
                  name="date"
                  type="datetime-local"
                  value={form.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="finished">Finished</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <button
              className="btn-primary events-submit-btn"
              type="submit"
              disabled={creating}
            >
              {creating ? "Creating..." : "Create Event"}
            </button>
          </form>
        </div>
      )}

      <div className="card events-filter-card">
        <form className="events-filter-form" onSubmit={handleFilterSubmit}>
          <div className="form-group events-filter-group">
            <label className="form-label">Status</label>
            <select
              className="form-input events-filter-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="finished">Finished</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="form-group events-filter-group">
            <label className="form-label">Date</label>
            <input
              className="form-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <button className="btn-secondary" type="submit">
            Filter
          </button>

          <button className="btn-secondary" type="button" onClick={handleReset}>
            Reset
          </button>
        </form>
      </div>

      {deleteError && <div className="alert-error events-alert">{deleteError}</div>}

      {events.length === 0 ? (
        <div className="card events-empty">
          <div className="events-empty-icon"></div>
          <p>No events found.</p>
        </div>
      ) : (
        <div className="events-list">
          {events.map((event) => (
            <div className="card events-card" key={event.id}>
              {editingId === event.id ? (
                <div>
                  <h3 className="events-edit-title">Edit Event</h3>

                  <div className="events-grid-two">
                    <div className="form-group">
                      <label className="form-label">Name</label>
                      <input
                        className="form-input"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Date & Time</label>
                      <input
                        className="form-input"
                        name="date"
                        type="datetime-local"
                        value={editForm.date}
                        onChange={handleEditChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-input events-edit-textarea"
                      name="description"
                      value={editForm.description}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-input events-status-select"
                      name="status"
                      value={editForm.status}
                      onChange={handleEditChange}
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="finished">Finished</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {editError && <div className="alert-error events-alert">{editError}</div>}

                  <div className="events-edit-actions">
                    <button
                      className="btn-primary events-toggle-btn"
                      onClick={() => handleUpdate(event.id)}
                    >
                      Save
                    </button>
                    <button className="btn-secondary" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="events-card-content">
                  <div className="events-card-main">
                    <div className="events-card-top">
                      <h3 className="events-card-title">
                        <Link className="events-link" to={`/events/${event.id}`}>
                          {event.name}
                        </Link>
                      </h3>

                      <span className={`badge ${STATUS_COLORS[event.status] || "badge-blue"}`}>
                        {event.status}
                      </span>
                    </div>

                    {event.description && (
                      <p className="events-description">{event.description}</p>
                    )}

                    <p className="events-date">
                      {new Date(event.date).toLocaleString()}
                    </p>
                  </div>

                  {isStaff && (
                    <div className="events-actions">
                      <button
                        className="btn-secondary"
                        onClick={() => startEdit(event)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => openDeleteModal(event)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {eventToDelete && (
        <div className="events-modal-backdrop">
          <div className="card events-modal">
            <h3 className="events-modal-title">Confirm deletion</h3>

            <p className="events-modal-text">
              Are you sure you want to delete{" "}
              <strong className="events-modal-strong">{eventToDelete.name}</strong>?
            </p>

            <p className="events-modal-warning">This action cannot be undone.</p>

            {deleteError && <div className="alert-error events-alert">{deleteError}</div>}

            <div className="events-modal-actions">
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