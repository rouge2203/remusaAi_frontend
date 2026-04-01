import { motion } from 'framer-motion'
import { HiOutlineUser } from 'react-icons/hi2'
import { RiRobot2Line } from 'react-icons/ri'
import type { ChatMessage as ChatMessageType } from '../../types'

interface ChatMessageProps {
  message: ChatMessageType;
  index: number;
}

export default function ChatMessage({ message, index }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.05 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
          isUser
            ? 'bg-accent-orange/20 text-accent-orange'
            : 'bg-accent-blue/20 text-accent-blue'
        }`}
      >
        {isUser ? <HiOutlineUser className="text-sm" /> : <RiRobot2Line className="text-sm" />}
      </div>

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-accent-orange/15 text-text-primary rounded-tr-md'
            : 'bg-white/5 text-text-primary border border-white/5 rounded-tl-md'
        }`}
      >
        {message.content}
      </div>
    </motion.div>
  );
}
