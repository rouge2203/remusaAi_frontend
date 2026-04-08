import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiXMark } from "react-icons/hi2";
import { RiRobot2Line } from "react-icons/ri";
import type { ChatMessage as ChatMessageType } from "../../types";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

interface ChatDialogProps {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_RESPONSE =
  "Función en desarrollo. Pronto podrás hacer preguntas sobre tu vehículo, consultar disponibilidad de repuestos y obtener recomendaciones de piezas compatibles.";

export default function ChatDialog({ open, onClose }: ChatDialogProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (content: string) => {
    const userMsg: ChatMessageType = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      const assistantMsg: ChatMessageType = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: DEFAULT_RESPONSE,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    }, 800);
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
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Same horizontal rhythm as Layout shell: lg:px-6 + max-w-[1200px] */}
          <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-0 lg:px-6 pointer-events-none">
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
              <div className="flex h-full flex-col overflow-hidden rounded-t-[28px] border border-neutral-200/90 border-b-0 bg-[#ececf0] shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.25)]">
                <div className="flex shrink-0 items-center justify-between border-b border-neutral-200/80 bg-white px-4 py-3.5 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#75141C]/10 text-[#75141C]">
                      <RiRobot2Line className="text-xl" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-[15px] font-bold leading-tight tracking-tight text-neutral-900">
                        Asistente
                      </h2>
                      <p className="font-mono text-[11px] text-neutral-500">{"> remusa ai · chat"}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition-all duration-200 hover:bg-neutral-50 hover:text-neutral-900 active:scale-95"
                    aria-label="Cerrar"
                  >
                    <HiXMark className="text-lg" />
                  </button>
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
                          Pregunta sobre vehículos, piezas compatibles, disponibilidad en inventario y más.
                        </p>
                      </motion.div>
                    )}

                    {messages.map((msg, i) => (
                      <ChatMessage key={msg.id} message={msg} index={i} />
                    ))}
                  </div>
                </div>

                <ChatInput onSend={handleSend} />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
