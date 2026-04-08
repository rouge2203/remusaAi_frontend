import { useState, type ReactNode } from "react";
import type { MenuItem } from "../../constants/remusaMenu";
import { MenuTerminalRow } from "./MenuTerminalRow";

interface TerminalMenuProps {
  title?: string;
  items: readonly MenuItem[] | MenuItem[];
  /** Which row looks “selected” (gray panel) — defaults to first */
  defaultSelectedId?: string;
  onSelect?: (item: MenuItem) => void;
  /** Optional footer under the list (omit to hide). */
  footer?: ReactNode;
}

export default function TerminalMenu({
  title = "catalogo epc",
  items,
  defaultSelectedId,
  onSelect,
  footer,
}: TerminalMenuProps) {
  const first = items[0]?.id ?? "";
  const [selectedId, setSelectedId] = useState(defaultSelectedId ?? first);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
      <p className="mb-2 px-1 font-mono text-[10px] font-medium uppercase tracking-widest text-neutral-400">
        {`> ${title}`}
      </p>
      <ul className="flex max-h-[50vh] flex-col gap-1 overflow-y-auto">
        {items.map((item) => {
          const active = selectedId === item.id;
          return (
            <li key={item.id}>
              <MenuTerminalRow
                item={item}
                active={active}
                onSelect={(i) => {
                  setSelectedId(i.id);
                  onSelect?.(i);
                }}
              />
            </li>
          );
        })}
      </ul>
      {footer != null ? (
        <div className="mt-2 px-1 font-mono text-[10px] text-neutral-400">{footer}</div>
      ) : null}
    </div>
  );
}
