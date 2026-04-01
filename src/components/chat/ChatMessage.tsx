import { motion } from "framer-motion";
import { HiOutlineUser } from "react-icons/hi2";
import { RiRobot2Line } from "react-icons/ri";
import type { ChatMessage as ChatMessageType } from "../../types";

interface ChatMessageProps {
  message: ChatMessageType;
  index: number;
}

export default function ChatMessage({ message, index }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.04 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          isUser ? "bg-[#75141C]/12 text-[#75141C]" : "bg-neutral-100 text-neutral-700"
        }`}
      >
        {isUser ? <HiOutlineUser className="text-base" /> : <RiRobot2Line className="text-base" />}
      </div>

      <div
        className={`max-w-[85%] rounded-2xl border px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "border-[#75141C]/25 bg-white text-neutral-900 rounded-tr-md"
            : "border-neutral-200/90 bg-white text-neutral-800 rounded-tl-md"
        }`}
      >
        {message.role === "assistant" ? (
          <p className="font-mono text-[13px] leading-relaxed text-neutral-700">
            <span className="text-neutral-400">{"> "}</span>
            {message.content}
          </p>
        ) : (
          message.content
        )}
      </div>
    </motion.div>
  );
}
