import { getToken, clearToken } from "../store/authStore";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000/api/";

export async function apiFetch(path, { method = "GET", body } = {}) {
  const token = getToken();

  const res = await fetch(API_BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;

  if (res.status !== 204) {
    data = await res.json().catch(() => null);
  }

  if (!res.ok) {
    if (res.status === 401 || data?.code === "token_not_valid") {
      clearToken();
      localStorage.removeItem("refresh");
      window.location.href = "/login";
    }

    throw new Error(
      data?.detail || data?.error || data?.message || "Request failed"
    );
  }

  return data;
}