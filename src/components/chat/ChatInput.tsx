import { useState } from 'react'
import { HiOutlinePaperAirplane } from 'react-icons/hi2'

interface ChatInputProps {
  onSend: (message: string) => void;
}

export default function ChatInput({ onSend }: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSend(value.trim());
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t border-white/5">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Escribe tu pregunta..."
        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-orange/50 transition-colors duration-300"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="w-11 h-11 rounded-xl bg-accent-orange flex items-center justify-center text-white transition-all duration-200 hover:brightness-110 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
      >
        <HiOutlinePaperAirplane className="text-lg" />
      </button>
    </form>
  );
}
