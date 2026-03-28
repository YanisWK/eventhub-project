import { getToken } from "../store/authStore";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000/api/";

export async function apiFetch(path, { method = "GET", body } = {}) {
  const token = getToken();

  const res = await fetch(API_BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      data?.detail || JSON.stringify(data) || data?.error || "Request failed"
    );
  }

  return data;
}