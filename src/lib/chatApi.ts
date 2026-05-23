import type { AssistantPart, Conversation } from "../types";
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
    /** Reconstructed assistant parts (cards + text) — populated only for assistant rows. */
    parts: AssistantPart[] | null;
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

// ── Streaming chat ────────────────────────────────────────────────────────

export type StreamEvent =
  | { type: "tool_call"; name: string; input: Record<string, unknown> }
  | {
      type: "block";
      kind:
        | "remusa-parts"
        | "remusa-part-detail"
        | "remusa-doc-list"
        | "remusa-doc-detail"
        | "remusa-chart"
        | "remusa-vehicle";
      name: string;
      data: unknown;
    }
  | { type: "text"; text: string }
  | {
      type: "done";
      assistant_text: string;
      input_tokens: number;
      output_tokens: number;
      conversation_title: string;
      is_locked: boolean;
    }
  | { type: "error"; detail: string };

/**
 * Stream the assistant turn as Server-Sent Events. `onEvent` is invoked
 * synchronously for each parsed event. Resolves when the stream ends; rejects
 * on transport errors (non-2xx after refresh, network failure). A 409
 * (conversation locked / cap reached) is surfaced as a thrown
 * `{ status: 409, data }` matching the shape used elsewhere in this module.
 */
export async function sendMessageStream(
  conversationId: string,
  text: string,
  onEvent: (evt: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const url = `${API_ROOT}/chat/conversations/${conversationId}/messages/`;

  const doFetch = (token: string | null) =>
    fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ text }),
      signal,
    });

  let res = await doFetch(getAccessToken());
  if (res.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) res = await doFetch(refreshed.access);
  }

  if (!res.ok) {
    // Non-streaming error responses (e.g. 409 limit_reached) still arrive as JSON.
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      /* ignore */
    }
    throw { status: res.status, data };
  }

  if (!res.body) {
    throw new Error("Streaming response has no body");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  // The fetch signal aborts the request *handshake*; once the body has
  // started streaming we also need to cancel the reader so an external
  // ``controller.abort()`` actually stops the loop. Wire that up.
  const onAbort = () => {
    reader.cancel().catch(() => {
      /* the reject below already surfaces the abort */
    });
  };
  if (signal) {
    if (signal.aborted) {
      onAbort();
    } else {
      signal.addEventListener("abort", onAbort, { once: true });
    }
  }

  // Parse SSE frames separated by blank lines. Each frame may contain one or
  // more `data: ` lines (we only emit single-line `data:` payloads server-side,
  // but handle the multi-line case for robustness).
  const processFrame = (frame: string) => {
    const dataLines: string[] = [];
    for (const line of frame.split("\n")) {
      if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).replace(/^ /, ""));
      }
    }
    if (dataLines.length === 0) return;
    const payload = dataLines.join("\n");
    try {
      onEvent(JSON.parse(payload) as StreamEvent);
    } catch (err) {
      console.warn("Failed to parse SSE payload:", payload, err);
    }
  };

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();
      if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        if (frame.length > 0) processFrame(frame);
      }
    }
    // Flush any trailing frame (typical SSE always ends with \n\n but be safe).
    if (buffer.trim().length > 0) {
      processFrame(buffer);
    }
  } finally {
    if (signal) signal.removeEventListener("abort", onAbort);
  }
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

export interface AdminUserWithChats extends AdminUser {
  chat_count: number;
  last_at: string;
}

export async function listAdminUsersWithChats(): Promise<{ results: AdminUserWithChats[] }> {
  return chatFetch("/admin/users-with-chats/");
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
