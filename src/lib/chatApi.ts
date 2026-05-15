import type { Conversation } from "../types";
import { getAccessToken, refresh as refreshToken } from "./authApi";

const API_ROOT = `${import.meta.env.VITE_API_BASE ?? ""}`.replace(/\/$/, "") + "/api";

async function chatFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_ROOT}${path}`;

  const doFetch = (token: string | null) =>
    fetch(url, {
      ...init,
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });

  let res = await doFetch(getAccessToken());

  if (res.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      res = await doFetch(refreshed.access);
    }
  }

  const data = await res.json();
  if (!res.ok) throw { status: res.status, data };
  return data as T;
}

export async function listConversations(): Promise<Conversation[]> {
  return chatFetch("/chat/conversations/");
}

export async function createConversation(): Promise<{ id: string; title: string }> {
  return chatFetch("/chat/conversations/create/", { method: "POST", body: "{}" });
}

export interface ConversationDetail {
  id: string;
  title: string;
  is_locked: boolean;
  total_input_tokens: number;
  total_output_tokens: number;
  messages: {
    id: string;
    role: "user" | "assistant" | "tool";
    text: string;
    tool_calls: { name: string; input: Record<string, unknown> }[] | null;
    created_at: string;
  }[];
}

export async function getConversation(id: string): Promise<ConversationDetail> {
  return chatFetch(`/chat/conversations/${id}/`);
}

export interface SendMessageResponse {
  assistant_text: string;
  conversation_title: string;
  is_locked: boolean;
  input_tokens: number;
  output_tokens: number;
}

export async function sendMessage(conversationId: string, text: string): Promise<SendMessageResponse> {
  return chatFetch(`/chat/conversations/${conversationId}/messages/`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function deleteConversation(id: string): Promise<void> {
  await chatFetch(`/chat/conversations/${id}/delete/`, { method: "DELETE" });
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const url = `${API_ROOT}/chat/transcribe/`;
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  const doFetch = (token: string | null) =>
    fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

  let res = await doFetch(getAccessToken());
  if (res.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) res = await doFetch(refreshed.access);
  }

  const data = await res.json();
  if (!res.ok) throw { status: res.status, data };
  return (data as { text: string }).text;
}

export interface SendVoiceResponse extends SendMessageResponse {
  transcribed_text: string;
}

// ── Admin endpoints ───────────────────────────────────────────────────────

export interface AdminConversation {
  id: string;
  title: string;
  updated_at: string;
  is_locked: boolean;
  user: {
    id: number;
    username: string;
    full_name: string;
    tipo_cliente: string | null;
  };
}

export interface AdminConversationsResponse {
  total: number;
  page: number;
  page_size: number;
  results: AdminConversation[];
}

export interface AdminUser {
  id: number;
  username: string;
  full_name: string;
  tipo_cliente: string | null;
}

export interface AdminConversationDetail extends ConversationDetail {
  user: {
    id: number;
    username: string;
    full_name: string;
    tipo_cliente: string | null;
  };
}

export async function listAdminChats(params: {
  user_id?: number;
  username?: string;
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<AdminConversationsResponse> {
  const qs = new URLSearchParams();
  if (params.user_id != null) qs.set("user_id", String(params.user_id));
  if (params.username) qs.set("username", params.username);
  if (params.search) qs.set("search", params.search);
  if (params.page != null) qs.set("page", String(params.page));
  if (params.page_size != null) qs.set("page_size", String(params.page_size));
  const q = qs.toString();
  return chatFetch(`/admin/chats/${q ? `?${q}` : ""}`);
}

export async function getAdminChat(id: string): Promise<AdminConversationDetail> {
  return chatFetch(`/admin/chats/${id}/`);
}

export async function searchAdminUsers(q: string): Promise<{ results: AdminUser[] }> {
  return chatFetch(`/admin/users/?search=${encodeURIComponent(q)}`);
}

export async function sendVoiceMessage(
  conversationId: string,
  audioBlob: Blob,
): Promise<SendVoiceResponse> {
  const url = `${API_ROOT}/chat/conversations/${conversationId}/voice/`;

  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  const doFetch = (token: string | null) =>
    fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

  let res = await doFetch(getAccessToken());

  if (res.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      res = await doFetch(refreshed.access);
    }
  }

  const data = await res.json();
  if (!res.ok) throw { status: res.status, data };
  return data as SendVoiceResponse;
}
