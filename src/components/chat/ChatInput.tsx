import { forwardRef, useCallback } from "react";
import { HiOutlinePaperAirplane, HiOutlineLightBulb } from "react-icons/hi2";
import MicButton from "./MicButton";

interface ChatInputProps {
  value: string;
  onValueChange: (value: string) => void;
  onSend: (message: string) => void;
  disabled?: boolean;
  suggestionsOpen?: boolean;
  onToggleSuggestions?: () => void;
}

const ChatInput = forwardRef<HTMLInputElement, ChatInputProps>(function ChatInput(
  { value, onValueChange, onSend, disabled, suggestionsOpen, onToggleSuggestions },
  ref,
) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) {
      onSend(trimmed);
      onValueChange("");
    }
  };

  const handleTranscribed = useCallback(
    (text: string) => {
      onValueChange(text);
      // Focus the input so the user sees the text and can edit or just press Enter.
      requestAnimationFrame(() => {
        if (ref && "current" in ref && ref.current) {
          ref.current.focus();
          ref.current.setSelectionRange(text.length, text.length);
        }
      });
    },
    [onValueChange, ref],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 border-t border-neutral-200/90 bg-white px-4 py-3.5 sm:px-5"
    >
      <div className="flex gap-2">
        {onToggleSuggestions && (
          <button
            type="button"
            onClick={onToggleSuggestions}
            title="Sugerencias de preguntas"
            className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl border transition-all duration-200 active:scale-95 ${
              suggestionsOpen
                ? "border-[#75141C]/40 bg-[#75141C]/10 text-[#75141C]"
                : "border-neutral-200 bg-neutral-50 text-neutral-400 hover:border-[#75141C]/30 hover:bg-[#75141C]/5 hover:text-[#75141C]"
            }`}
            aria-label="Ver sugerencias"
          >
            <HiOutlineLightBulb className="text-lg" />
          </button>
        )}
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder="Escribe tu pregunta..."
          disabled={disabled}
          className="min-w-0 flex-1 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#75141C] focus:outline-none focus:ring-2 focus:ring-[#75141C]/15 disabled:opacity-50"
        />
        <MicButton onTranscribed={handleTranscribed} disabled={disabled} />
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl bg-[#75141C] text-white transition-all duration-200 hover:bg-[#5c1018] active:scale-95 disabled:opacity-35 disabled:hover:bg-[#75141C]"
          aria-label="Enviar"
        >
          <HiOutlinePaperAirplane className="text-lg" />
        </button>
      </div>
      <p className="mt-2 font-mono text-[10px] text-neutral-400">
        enter para enviar · mantén el mic para hablar
      </p>
    </form>
  );
});

export default ChatInput;
