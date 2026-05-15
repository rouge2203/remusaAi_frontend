import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineArrowLeft,
  HiOutlineMagnifyingGlass,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlineClock,
  HiOutlineXMark,
} from "react-icons/hi2";
import { RiRobot2Line } from "react-icons/ri";
import ChatMessage from "../components/chat/ChatMessage";
import {
  listAdminChats,
  getAdminChat,
  searchAdminUsers,
  type AdminConversation,
  type AdminConversationDetail,
  type AdminUser,
} from "../lib/chatApi";
import { useAuth } from "../contexts/AuthContext";

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "ahora";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)} d`;
  return d.toLocaleDateString("es-CR", { day: "2-digit", month: "short" });
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── User search autocomplete ───────────────────────────────────────────────

interface UserPickerProps {
  onSelect: (user: AdminUser) => void;
  initialUsername?: string;
}

function UserPicker({ onSelect, initialUsername }: UserPickerProps) {
  const [query, setQuery] = useState(initialUsername || "");
  const [results, setResults] = useState<AdminUser[]>([]);
  const [open, setOpen] = useState(false);
  const debouncedQ = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debouncedQ.trim().length < 2) { setResults([]); return; }
    searchAdminUsers(debouncedQ).then((r) => { setResults(r.results); setOpen(true); }).catch(() => {});
  }, [debouncedQ]);

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2">
        <HiOutlineMagnifyingGlass className="shrink-0 text-sm text-neutral-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por usuario o nombre…"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(""); setResults([]); setOpen(false); }}>
            <HiOutlineXMark className="text-sm text-neutral-400 hover:text-neutral-700" />
          </button>
        )}
      </div>
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg"
          >
            {results.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => { setQuery(u.full_name || u.username); setOpen(false); onSelect(u); }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-[13px] transition hover:bg-neutral-50"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
                    <HiOutlineUser className="text-sm" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-800">{u.full_name || u.username}</p>
                    <p className="text-[11px] text-neutral-400">@{u.username} · {u.tipo_cliente ?? "staff"}</p>
                  </div>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function AdminChatsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Gate: redirect non-superusers
  useEffect(() => {
    if (user && !user.is_superuser && !user.is_staff) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const initialUsername = searchParams.get("username") || undefined;
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [convDetail, setConvDetail] = useState<AdminConversationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async (params: { username?: string; user_id?: number }) => {
    setLoadingConvs(true);
    setConversations([]);
    setSelectedConvId(null);
    setConvDetail(null);
    try {
      const res = await listAdminChats({ ...params, page_size: 50 });
      setConversations(res.results);
    } catch {
      setConversations([]);
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  // Load from URL param on mount
  useEffect(() => {
    if (initialUsername) {
      loadConversations({ username: initialUsername });
    } else {
      // Load all recent conversations if no filter
      loadConversations({});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUserSelect = useCallback((u: AdminUser) => {
    setSelectedUser(u);
    setSearchParams({ username: u.username });
    loadConversations({ username: u.username });
  }, [loadConversations, setSearchParams]);

  const handleConvSelect = useCallback(async (id: string) => {
    setSelectedConvId(id);
    setConvDetail(null);
    setLoadingDetail(true);
    try {
      const detail = await getAdminChat(id);
      setConvDetail(detail);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 100);
    } catch {
      setConvDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const owner = convDetail?.user ?? selectedUser ?? conversations[0]?.user ?? null;

  return (
    <div className="flex h-screen w-full flex-col bg-[#f5f5f5]">
      {/* Top bar */}
      <header className="flex shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
          aria-label="Volver"
        >
          <HiOutlineArrowLeft className="text-base" />
        </button>
        <div>
          <h1 className="text-[14px] font-bold tracking-tight text-neutral-900">
            Historial de Chats
          </h1>
          <p className="font-mono text-[10px] text-neutral-400">{"> solo lectura · admin"}</p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="flex w-72 shrink-0 flex-col border-r border-neutral-200 bg-white">
          <div className="shrink-0 border-b border-neutral-100 p-3">
            <UserPicker onSelect={handleUserSelect} initialUsername={initialUsername} />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
            {loadingConvs ? (
              <p className="px-3 py-6 text-center font-mono text-[12px] text-neutral-400">
                {"> cargando..."}
              </p>
            ) : conversations.length === 0 ? (
              <p className="px-3 py-6 text-center font-mono text-[12px] text-neutral-400">
                {"> sin conversaciones"}
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {conversations.map((c) => {
                  const active = c.id === selectedConvId;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => handleConvSelect(c.id)}
                        className={`group flex w-full items-start gap-2 rounded-xl border px-2.5 py-2.5 text-left transition-all ${
                          active
                            ? "border-[#75141C]/30 bg-[#75141C]/5"
                            : "border-transparent hover:border-neutral-200 hover:bg-neutral-50"
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            active ? "bg-[#75141C]/15 text-[#75141C]" : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {c.is_locked ? (
                            <HiOutlineLockClosed className="text-sm" />
                          ) : (
                            <RiRobot2Line className="text-sm" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-[12px] font-medium ${active ? "text-[#75141C]" : "text-neutral-800"}`}>
                            {c.title || "Sin título"}
                          </p>
                          <p className="font-mono text-[10px] text-neutral-400">
                            @{c.user.username} · {formatRelative(c.updated_at)}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {conversations.length > 0 && (
            <div className="shrink-0 border-t border-neutral-100 px-3 py-2">
              <p className="text-[10px] text-neutral-400">
                {conversations.length} conversacion{conversations.length !== 1 ? "es" : ""}
              </p>
            </div>
          )}
        </aside>

        {/* Viewer */}
        <main className="flex min-h-0 flex-1 flex-col">
          {!selectedConvId ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
                  <HiOutlineClock className="text-2xl" />
                </div>
                <p className="text-sm font-medium text-neutral-500">
                  Selecciona una conversación para verla
                </p>
                <p className="mt-1 text-[11px] text-neutral-400">
                  Modo solo lectura — no puedes enviar mensajes
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Conversation header */}
              {(convDetail || owner) && (
                <div className="shrink-0 border-b border-neutral-200 bg-white px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
                      <HiOutlineUser className="text-sm" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-neutral-800">
                        {convDetail?.title || "Conversación"}
                      </p>
                      <p className="font-mono text-[10px] text-neutral-400">
                        @{(convDetail?.user ?? owner)?.username} · Solo lectura
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div
                ref={scrollRef}
                className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6"
              >
                <div className="flex flex-col gap-4">
                  {loadingDetail && (
                    <div className="py-8 text-center font-mono text-[12px] text-neutral-400">
                      {"> cargando conversación..."}
                    </div>
                  )}

                  {convDetail?.messages.map((msg, i) => (
                    <ChatMessage
                      key={msg.id}
                      message={{
                        id: msg.id,
                        role: msg.role as "user" | "assistant" | "tool",
                        content: msg.text,
                        timestamp: new Date(msg.created_at),
                        toolCalls: msg.tool_calls ?? undefined,
                      }}
                      index={i}
                      isSuperUser={user?.is_superuser}
                    />
                  ))}

                  {loadingDetail && (
                    <div className="py-4 text-center font-mono text-[12px] text-neutral-400">
                      {"> cargando mensajes..."}
                    </div>
                  )}
                </div>
              </div>

              {/* Read-only notice */}
              <div className="shrink-0 border-t border-neutral-200 bg-neutral-50 px-4 py-2.5 text-center">
                <p className="text-[11px] text-neutral-400">
                  Vista de solo lectura — no puedes enviar mensajes en este historial
                </p>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
