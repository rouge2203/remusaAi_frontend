import type { MenuItem } from "../../constants/remusaMenu";

interface MenuTerminalRowProps {
  item: MenuItem;
  active?: boolean;
  onSelect: (item: MenuItem) => void;
  /** Dark rows for floating dock (brand red / dark panels). */
  variant?: "light" | "dark";
  disabled?: boolean;
}

/** Shared row styling with [`TerminalMenu`](./TerminalMenu.tsx). */
export function MenuTerminalRow({
  item,
  active = false,
  onSelect,
  variant = "light",
  disabled = false,
}: MenuTerminalRowProps) {
  const row =
    variant === "dark"
      ? active
        ? "bg-white/12 text-white"
        : "text-white/90 hover:bg-white/10"
      : active
        ? "bg-neutral-100 text-neutral-900"
        : "text-neutral-800 hover:bg-neutral-50";

  const prompt =
    variant === "dark" ? "text-white/45" : "text-neutral-400";
  const sub = variant === "dark" ? "text-white/55" : "text-neutral-500";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(item)}
      className={`min-h-[44px] w-full rounded-xl px-3 py-3 text-left font-mono transition-colors disabled:pointer-events-none disabled:opacity-40 ${row}`}
    >
      <span className="block text-[13px] font-semibold leading-snug capitalize">
        <span className={`font-normal ${prompt}`}>{"> "}</span>
        {item.title}
      </span>
      {item.subtitle ? (
        <span className={`mt-0.5 block pl-4 text-[11px] font-normal leading-snug ${sub}`}>
          {item.subtitle}
        </span>
      ) : null}
    </button>
  );
}
