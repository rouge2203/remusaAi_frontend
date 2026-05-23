import { useState, useCallback, useEffect, useRef } from "react";
import type { ChatMessage, AssistantPart, Conversation } from "../types";
import * as chatApi from "../lib/chatApi";
import type { StreamEvent } from "../lib/chatApi";

type ChatStatus = "idle" | "sending" | "locked" | "error";

export function useChat() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState<string>("Nueva conversación");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const streamAbortRef = useRef<AbortController | null>(null);
  const [viewingAsAdmin, setViewingAsAdmin] = useState(false);

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

  const loadConversation = useCallback(
    async (id: string, opts?: { admin?: boolean }) => {
      const asAdmin = !!opts?.admin;
      try {
        const detail = asAdmin
          ? await chatApi.getAdminChat(id)
          : await chatApi.getConversation(id);
        setConversationId(id);
        setConversationTitle(detail.title);
        setViewingAsAdmin(asAdmin);
        // Admin viewer is read-only — keep status idle so the sender side
        // can disable input independently. Owned convos still respect lock.
        setStatus(!asAdmin && detail.is_locked ? "locked" : "idle");

        const mapped: ChatMessage[] = detail.messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.text,
            parts: m.parts ?? undefined,
            timestamp: new Date(m.created_at),
            toolCalls: m.tool_calls ?? undefined,
          }));
        setMessages(mapped);
      } catch {
        setStatus("error");
      }
    },
    [],
  );

  useEffect(() => {
    // Just preload the conversation list for the history drawer. Don't
    // resume the last conversation on page reload — start fresh every time.
    refreshConversations();
  }, [refreshConversations]);

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
    const assistantId = crypto.randomUUID();
    const assistantPlaceholder: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      parts: [],
      streaming: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setStatus("sending");

    const updateAssistant = (mut: (m: ChatMessage) => ChatMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? mut(m) : m)),
      );
    };

    const handleEvent = (evt: StreamEvent) => {
      if (evt.type === "text") {
        updateAssistant((m) => {
          const parts = [...(m.parts ?? [])];
          const last = parts[parts.length - 1];
          if (last && last.kind === "text") {
            parts[parts.length - 1] = { kind: "text", text: last.text + evt.text };
          } else {
            parts.push({ kind: "text", text: evt.text });
          }
          return { ...m, parts };
        });
      } else if (evt.type === "block") {
        const blockPart: AssistantPart = {
          kind: evt.kind,
          name: evt.name,
          data: evt.data,
        };
        updateAssistant((m) => ({
          ...m,
          parts: [...(m.parts ?? []), blockPart],
        }));
      } else if (evt.type === "tool_call") {
        updateAssistant((m) => ({
          ...m,
          toolCalls: [...(m.toolCalls ?? []), { name: evt.name, input: evt.input }],
        }));
      } else if (evt.type === "done") {
        updateAssistant((m) => ({
          ...m,
          content: evt.assistant_text,
          streaming: false,
        }));
        setConversationTitle(evt.conversation_title);
        setStatus(evt.is_locked ? "locked" : "idle");
        if (createdNew || evt.conversation_title !== conversationTitle) {
          refreshConversations();
        }
      } else if (evt.type === "error") {
        updateAssistant((m) => ({
          ...m,
          parts: [...(m.parts ?? []), { kind: "text", text: evt.detail }],
          streaming: false,
        }));
        setStatus("error");
      }
    };

    const controller = new AbortController();
    streamAbortRef.current = controller;

    try {
      await chatApi.sendMessageStream(cid, text, handleEvent, controller.signal);
      // If the stream ended without a `done` event (e.g. abrupt close), make sure we clear the streaming flag.
      updateAssistant((m) => (m.streaming ? { ...m, streaming: false } : m));
    } catch (err: unknown) {
      // User-initiated abort: keep whatever was already received and reset state.
      if (
        (err instanceof DOMException && err.name === "AbortError") ||
        (err as { name?: string })?.name === "AbortError"
      ) {
        updateAssistant((m) => ({
          ...m,
          parts: [
            ...(m.parts ?? []),
            { kind: "text", text: "_(Solicitud detenida.)_" },
          ],
          streaming: false,
        }));
        setStatus("idle");
      } else {
        const errorData = err as { status?: number; data?: { error?: string } };
        if (errorData.status === 409 && errorData.data?.error === "limit_reached") {
          setStatus("locked");
          refreshConversations();
          updateAssistant((m) => ({ ...m, streaming: false }));
        } else {
          setStatus("error");
          updateAssistant((m) => ({
            ...m,
            parts: [
              ...(m.parts ?? []),
              { kind: "text", text: "Error interno. Por favor intenta de nuevo." },
            ],
            streaming: false,
          }));
        }
      }
    } finally {
      if (streamAbortRef.current === controller) {
        streamAbortRef.current = null;
      }
    }
  }, [conversationId, conversationTitle, refreshConversations]);

  const stop = useCallback(() => {
    const ctrl = streamAbortRef.current;
    if (ctrl) {
      ctrl.abort();
      streamAbortRef.current = null;
    }
  }, []);

  const sendVoice = useCallback(async (audioBlob: Blob) => {
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

    setStatus("sending");

    try {
      const resp = await chatApi.sendVoiceMessage(cid, audioBlob);

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: resp.transcribed_text,
        timestamp: new Date(),
      };
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: resp.assistant_text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
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
        const errText = errorData.data?.error ?? "Error interno. Por favor intenta de nuevo.";
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: errText,
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
    setViewingAsAdmin(false);
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
    viewingAsAdmin,
    send,
    sendVoice,
    stop,
    startNew,
    conversations,
    loadingHistory,
    loadConversation,
    refreshConversations,
    removeConversation,
  };
}
