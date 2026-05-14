import { useState } from "react";
import { HiOutlinePaperAirplane } from "react-icons/hi2";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSend(value.trim());
      setValue("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 border-t border-neutral-200/90 bg-white px-4 py-3.5 sm:px-5"
    >
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Escribe tu pregunta..."
          disabled={disabled}
          className="min-w-0 flex-1 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#75141C] focus:outline-none focus:ring-2 focus:ring-[#75141C]/15 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#75141C] text-white transition-all duration-200 hover:bg-[#5c1018] active:scale-95 disabled:opacity-35 disabled:hover:bg-[#75141C]"
          aria-label="Enviar"
        >
          <HiOutlinePaperAirplane className="text-lg" />
        </button>
      </div>
      <p className="mt-2 font-mono text-[10px] text-neutral-400">enter para enviar</p>
    </form>
  );
}
