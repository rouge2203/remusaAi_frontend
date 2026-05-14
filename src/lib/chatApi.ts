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
