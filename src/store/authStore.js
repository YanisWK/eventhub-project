const KEY = "token";

export const getToken = () => localStorage.getItem(KEY);

export const setToken = (token) => localStorage.setItem(KEY, token);

export const clearToken = () => localStorage.removeItem(KEY);

export const isAuthed = () => Boolean(getToken());

export async function getUserRole() {
  const token = getToken();
  if (!token) return null;

  try {
    const user = await fetch("http://localhost:8000/api/user/", {
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