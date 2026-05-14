import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiXMark,
  HiPlus,
  HiOutlineClock,
  HiOutlineTrash,
  HiOutlineLockClosed,
} from "react-icons/hi2";
import { RiRobot2Line } from "react-icons/ri";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import { useChat } from "../../hooks/useChat";
import { useAuth } from "../../contexts/AuthContext";

interface ChatDialogProps {
  open: boolean;
  onClose: () => void;
}

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

export default function ChatDialog({ open, onClose }: ChatDialogProps) {
  const {
    messages,
    status,
    send,
    startNew,
    conversationId,
    conversations,
    loadingHistory,
    loadConversation,
    removeConversation,
  } = useChat();
  const { user } = useAuth();
  const canDelete = !!user?.is_superuser;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (content: string) => {
    if (status === "sending" || status === "locked") return;
    send(content);
  };

  const handleNew = () => {
    startNew();
    setHistoryOpen(false);
  };

  const handleSelect = (id: string) => {
    loadConversation(id);
    setHistoryOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
          />

          <div className="fixed inset-x-0 bottom-0 z-[100] flex justify-center px-0 lg:px-6 pointer-events-none">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{
                type: "spring",
                damping: 32,
                stiffness: 320,
                mass: 0.85,
              }}
              className="pointer-events-auto h-[94vh] w-full max-w-[1200px]"
            >
              <div className="relative flex h-full flex-col overflow-hidden rounded-t-[28px] border border-neutral-200/90 border-b-0 bg-[#ececf0] shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.25)]">
                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-200/80 bg-white px-4 py-3.5 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#75141C]/10 text-[#75141C]">
                      <RiRobot2Line className="text-xl" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-[15px] font-bold leading-tight tracking-tight text-neutral-900">
                        Asistente
                      </h2>
                      <p className="font-mono text-[11px] text-neutral-500">
                        {"> remusa ai · chat"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => setHistoryOpen((v) => !v)}
                      className={`flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-all duration-200 active:scale-95 ${
                        historyOpen
                          ? "border-[#75141C]/35 bg-[#75141C]/10 text-[#75141C]"
                          : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                      }`}
                      aria-label="Historial de conversaciones"
                    >
                      <HiOutlineClock className="text-base" />
                      <span className="hidden sm:inline">Historial</span>
                      {conversations.length > 0 && (
                        <span className="rounded-full bg-neutral-200/70 px-1.5 text-[10px] font-semibold text-neutral-700">
                          {conversations.length}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleNew}
                      className="flex h-9 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-600 transition-all duration-200 hover:bg-neutral-50 hover:text-neutral-900 active:scale-95"
                      aria-label="Nueva conversación"
                    >
                      <HiPlus className="text-sm" />
                      <span className="hidden sm:inline">Nuevo</span>
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition-all duration-200 hover:bg-neutral-50 hover:text-neutral-900 active:scale-95"
                      aria-label="Cerrar"
                    >
                      <HiXMark className="text-lg" />
                    </button>
                  </div>
                </div>

                <div
                  ref={scrollRef}
                  className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5"
                >
                  <div className="flex min-h-full flex-col gap-4">
                    {messages.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="rounded-2xl border border-neutral-200/90 bg-white p-6 text-center shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]"
                      >
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#75141C]/10 text-[#75141C]">
                          <RiRobot2Line className="text-2xl" />
                        </div>
                        <h3 className="text-base font-bold tracking-tight text-neutral-900">
                          Remusa<span className="text-[#75141C]">AI</span>
                        </h3>
                        <p className="mt-1 font-mono text-[11px] text-neutral-400">
                          {"> session ready"}
                        </p>
                        <p className="mt-4 text-sm leading-relaxed text-neutral-500">
                          Dime qué repuesto necesitas. Puedes darme una placa, VIN o código de parte.
                        </p>
                      </motion.div>
                    )}

                    {messages.map((msg, i) => (
                      <ChatMessage key={msg.id} message={msg} index={i} />
                    ))}

                    {status === "sending" && <TypingIndicator />}
                  </div>
                </div>

                {status === "locked" ? (
                  <div className="shrink-0 border-t border-neutral-200/90 bg-white px-4 py-4 sm:px-5">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
                      <p className="text-sm text-amber-800">
                        Esta conversación alcanzó su límite.
                      </p>
                      <button
                        type="button"
                        onClick={handleNew}
                        className="mt-3 rounded-xl bg-gradient-to-b from-[#8f2330] to-[#75141C] px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-[#75141C] hover:to-[#5c1018] active:scale-[0.98]"
                      >
                        Iniciar nueva conversación
                      </button>
                    </div>
                  </div>
                ) : (
                  <ChatInput onSend={handleSend} disabled={status === "sending"} />
                )}

                {/* History drawer */}
                <AnimatePresence>
                  {historyOpen && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setHistoryOpen(false)}
                        className="absolute inset-0 z-10 bg-black/30"
                      />
                      <motion.aside
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 320 }}
                        className="absolute inset-y-0 left-0 z-20 flex w-[88%] max-w-[360px] flex-col border-r border-neutral-200/90 bg-white shadow-2xl"
                      >
                        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200/80 px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <HiOutlineClock className="text-lg text-[#75141C]" />
                            <h3 className="text-sm font-bold tracking-tight text-neutral-900">
                              Conversaciones
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setHistoryOpen(false)}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
                            aria-label="Cerrar historial"
                          >
                            <HiXMark className="text-base" />
                          </button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
                          {loadingHistory && conversations.length === 0 ? (
                            <p className="px-3 py-6 text-center font-mono text-[12px] text-neutral-400">
                              {"> cargando..."}
                            </p>
                          ) : conversations.length === 0 ? (
                            <p className="px-3 py-6 text-center font-mono text-[12px] text-neutral-400">
                              {"> sin conversaciones aún"}
                            </p>
                          ) : (
                            <ul className="flex flex-col gap-1">
                              {conversations.map((c) => {
                                const active = c.id === conversationId;
                                return (
                                  <li key={c.id}>
                                    <div
                                      className={`group flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-all ${
                                        active
                                          ? "border-[#75141C]/30 bg-[#75141C]/5"
                                          : "border-transparent hover:border-neutral-200 hover:bg-neutral-50"
                                      }`}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => handleSelect(c.id)}
                                        className="flex min-w-0 flex-1 items-start gap-2 text-left"
                                      >
                                        <div
                                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                                            active
                                              ? "bg-[#75141C]/15 text-[#75141C]"
                                              : "bg-neutral-100 text-neutral-500"
                                          }`}
                                        >
                                          {c.is_locked ? (
                                            <HiOutlineLockClosed className="text-sm" />
                                          ) : (
                                            <RiRobot2Line className="text-sm" />
                                          )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p
                                            className={`truncate text-[13px] font-medium ${
                                              active ? "text-[#75141C]" : "text-neutral-800"
                                            }`}
                                          >
                                            {c.title || "Sin título"}
                                          </p>
                                          <p className="font-mono text-[10px] text-neutral-400">
                                            {formatRelative(c.updated_at)}
                                            {c.is_locked && " · cerrada"}
                                          </p>
                                        </div>
                                      </button>
                                      {canDelete && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            removeConversation(c.id);
                                          }}
                                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-neutral-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 sm:opacity-0"
                                          aria-label="Eliminar conversación"
                                        >
                                          <HiOutlineTrash className="text-sm" />
                                        </button>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>

                        <div className="shrink-0 border-t border-neutral-200/80 p-3">
                          <button
                            type="button"
                            onClick={handleNew}
                            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-[#8f2330] to-[#75141C] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-[#75141C] hover:to-[#5c1018] active:scale-[0.98]"
                          >
                            <HiPlus className="text-base" />
                            Nueva conversación
                          </button>
                        </div>
                      </motion.aside>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
