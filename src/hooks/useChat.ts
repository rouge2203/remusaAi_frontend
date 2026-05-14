import { useState, useCallback, useEffect } from "react";
import type { ChatMessage, Conversation } from "../types";
import * as chatApi from "../lib/chatApi";

type ChatStatus = "idle" | "sending" | "locked" | "error";

export function useChat() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState<string>("Nueva conversación");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const refreshConversations = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const list = await chatApi.listConversations();
      setConversations(list);
      return list;
    } catch {
      return [] as Conversation[];
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    try {
      const detail = await chatApi.getConversation(id);
      setConversationId(id);
      setConversationTitle(detail.title);
      setStatus(detail.is_locked ? "locked" : "idle");

      const mapped: ChatMessage[] = detail.messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.text,
          timestamp: new Date(m.created_at),
          toolCalls: m.tool_calls ?? undefined,
        }));
      setMessages(mapped);
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    refreshConversations().then((list) => {
      const unlocked = list.find((c) => !c.is_locked);
      if (unlocked) {
        loadConversation(unlocked.id);
      }
    });
  }, [refreshConversations, loadConversation]);

  const send = useCallback(async (text: string) => {
    let cid = conversationId;
    let createdNew = false;

    if (!cid) {
      try {
        const created = await chatApi.createConversation();
        cid = created.id;
        createdNew = true;
        setConversationId(cid);
        setConversationTitle(created.title);
      } catch {
        setStatus("error");
        return;
      }
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setStatus("sending");

    try {
      const resp = await chatApi.sendMessage(cid, text);

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: resp.assistant_text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setConversationTitle(resp.conversation_title);
      setStatus(resp.is_locked ? "locked" : "idle");
      if (createdNew || resp.conversation_title !== conversationTitle) {
        refreshConversations();
      }
    } catch (err: unknown) {
      const errorData = (err as { status?: number; data?: { error?: string } });
      if (errorData.status === 409 && errorData.data?.error === "limit_reached") {
        setStatus("locked");
        refreshConversations();
      } else {
        setStatus("error");
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Error interno. Por favor intenta de nuevo.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    }
  }, [conversationId, conversationTitle, refreshConversations]);

  const startNew = useCallback(() => {
    setConversationId(null);
    setConversationTitle("Nueva conversación");
    setMessages([]);
    setStatus("idle");
  }, []);

  const removeConversation = useCallback(async (id: string) => {
    try {
      await chatApi.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (conversationId === id) {
        startNew();
      }
    } catch {
      // best-effort
    }
  }, [conversationId, startNew]);

  return {
    conversationId,
    conversationTitle,
    messages,
    status,
    send,
    startNew,
    conversations,
    loadingHistory,
    loadConversation,
    refreshConversations,
    removeConversation,
  };
}
