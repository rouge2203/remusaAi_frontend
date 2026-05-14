import type { AuthUser } from "../types";

const API_ROOT = `${import.meta.env.VITE_API_BASE ?? ""}`.replace(/\/$/, "") + "/api";

let _accessToken: string | null = localStorage.getItem("access_token");

export function getAccessToken(): string | null {
  return _accessToken;
}

export function setAccessToken(token: string | null) {
  _accessToken = token;
  if (token) {
    localStorage.setItem("access_token", token);
  } else {
    localStorage.removeItem("access_token");
  }
}

export async function login(username: string, password: string): Promise<{ user: AuthUser; access: string }> {
  const res = await fetch(`${API_ROOT}/login_admin/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data?.detail ?? data?.non_field_errors?.[0] ?? "Error de inicio de sesión";
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  setAccessToken(data.access);
  return { user: data.user, access: data.access };
}

export async function refresh(): Promise<{ user: AuthUser; access: string } | null> {
  try {
    const res = await fetch(`${API_ROOT}/refresh_token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: "{}",
    });

    if (!res.ok) return null;

    const data = await res.json();
    setAccessToken(data.access);
    return { user: data.user, access: data.access };
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_ROOT}/logout/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: "{}",
    });
  } catch {
    // best-effort
  }
  setAccessToken(null);
}
