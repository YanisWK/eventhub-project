import { API_BASE } from "../api/client";

const KEY = "token";

// Token helpers across the app
export const getToken = () => localStorage.getItem(KEY);
export const setToken = (token) => localStorage.setItem(KEY, token);
export const clearToken = () => localStorage.removeItem(KEY);

// true when an access token is stored (user logged in)
export const isAuthed = () => Boolean(getToken());

// Gets the authenticated user's role from the backend
export async function getUserRole() {
  const token = getToken();
  if (!token) return null;

  try {
    const user = await fetch(`${API_BASE}user/`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).then((res) => res.json());

    return {
      isStaff: user.is_staff,
      isSuperuser: user.is_superuser
    };
  } catch {
    return null;
  }
}