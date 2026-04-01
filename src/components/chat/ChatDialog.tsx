import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiXMark } from 'react-icons/hi2'
import { RiRobot2Line } from 'react-icons/ri'
import type { ChatMessage as ChatMessageType } from '../../types'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'

interface ChatDialogProps {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_RESPONSE = 'Función en desarrollo. Pronto podrás hacer preguntas sobre tu vehículo, consultar disponibilidad de repuestos y obtener recomendaciones de piezas compatibles.';

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
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      const assistantMsg: ChatMessageType = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: DEFAULT_RESPONSE,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
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
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
              mass: 0.8,
            }}
            className="fixed inset-x-0 bottom-0 z-50 h-[92vh] max-w-lg mx-auto"
          >
            <div className="h-full rounded-t-3xl bg-bg-card/90 backdrop-blur-2xl border border-white/10 border-b-0 flex flex-col overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center">
                    <RiRobot2Line className="text-accent-blue text-lg" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-text-primary">AI Assistant</h2>
                    <p className="text-xs text-text-muted">RemusaAI</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-text-secondary transition-all duration-200 hover:bg-white/20 hover:text-text-primary hover:scale-110 active:scale-90"
                >
                  <HiXMark className="text-lg" />
                </button>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
                {messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-12"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-accent-blue/10 flex items-center justify-center">
                      <RiRobot2Line className="text-3xl text-accent-blue" />
                    </div>
                    <h3 className="text-lg font-bold text-text-primary">RemusaAI Chat</h3>
                    <p className="text-sm text-text-muted max-w-[260px] leading-relaxed">
                      Pregunta sobre vehículos, piezas compatibles, disponibilidad en inventario y más.
                    </p>
                  </motion.div>
                )}

                {messages.map((msg, i) => (
                  <ChatMessage key={msg.id} message={msg} index={i} />
                ))}
              </div>

              <ChatInput onSend={handleSend} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
