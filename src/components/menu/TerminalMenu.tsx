import { useState } from "react";
import type { MenuItem } from "../../constants/remusaMenu";

interface TerminalMenuProps {
  title?: string;
  items: readonly MenuItem[] | MenuItem[];
  /** Which row looks “selected” (gray panel) — defaults to first */
  defaultSelectedId?: string;
  onSelect?: (item: MenuItem) => void;
}

export default function TerminalMenu({
  title = "catalogo epc",
  items,
  defaultSelectedId,
  onSelect,
}: TerminalMenuProps) {
  const first = items[0]?.id ?? "";
  const [selectedId, setSelectedId] = useState(defaultSelectedId ?? first);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
      <p className="mb-2 px-1 font-mono text-[10px] font-medium uppercase tracking-widest text-neutral-400">
        {`> ${title}`}
      </p>
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const active = selectedId === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(item.id);
                  onSelect?.(item);
                }}
                className={`w-full rounded-xl px-3 py-3 text-left font-mono transition-colors ${
                  active
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-neutral-800 hover:bg-neutral-50"
                }`}
              >
                <span className="block text-[13px] font-semibold leading-snug lowercase">
                  <span className="text-neutral-400 font-normal">{"> "}</span>
                  {item.title}
                </span>
                {item.subtitle ? (
                  <span className="mt-0.5 block pl-4 text-[11px] font-normal leading-snug text-neutral-500">
                    {item.subtitle}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 px-1 font-mono text-[10px] text-neutral-400">
        opciones desde sistema remusa (prox. integracion)
      </p>
    </div>
  );
}
