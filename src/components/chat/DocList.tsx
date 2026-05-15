/**
 * DocList — renders a ```remusa-doc-list``` fenced block as clickable rows.
 *
 * Each line from Claude is in one of two formats:
 *   Documents: "- NUM — TYPE · DATE · CLIENT · ₡AMOUNT · STATUS"
 *   Clients:   "- CODE — CLIENTE NAME · vendedor NAME · zona ZONE"
 *
 * Clicking a row fires onDocClick("Dame más info de NUM").
 */

interface DocRow {
  numero: string;
  tipo: string;
  rest: string;
  status: string;
}

const STATUS_TONE: Record<string, string> = {
  pendiente: "border-amber-200 bg-amber-50 text-amber-700",
  "en proceso": "border-blue-200 bg-blue-50 text-blue-700",
  parcial: "border-orange-200 bg-orange-50 text-orange-700",
  facturado: "border-green-200 bg-green-50 text-green-700",
  vigente: "border-green-200 bg-green-50 text-green-700",
  anulado: "border-neutral-200 bg-neutral-100 text-neutral-500",
  cancelado: "border-neutral-200 bg-neutral-100 text-neutral-500",
  cliente: "border-[#75141C]/20 bg-[#75141C]/5 text-[#75141C]",
};

const TYPE_LABEL: Record<string, string> = {
  PEDIDO: "PED",
  COTIZACION: "COT",
  FACTURA: "FAC",
  DEVOLUCION: "DEV",
  CLIENTE: "CLI",
};

function parseDocLine(line: string): DocRow | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  let rest = trimmed;
  if (rest.startsWith("- ")) rest = rest.slice(2);
  else if (rest.startsWith("-")) rest = rest.slice(1).trimStart();

  const emIdx = rest.search(/[—–]/);
  if (emIdx < 0) return null;

  const numero = rest.slice(0, emIdx).trim();
  const after = rest.slice(emIdx + 1).trim();

  if (!numero) return null;

  // Extract last segment as status (last · delimited field for docs, or "zona" for clients)
  const parts = after.split("·").map((s) => s.trim());

  let status = "";
  if (parts.length >= 1) {
    const last = parts[parts.length - 1];
    status = last.toLowerCase();
  }

  // Detect type from first segment
  const firstPart = parts[0] || "";
  const typeMatch = /^(PEDIDO|COTIZACION|FACTURA|DEVOLUCION|CLIENTE)\b/.exec(firstPart.toUpperCase());
  const tipo = typeMatch ? typeMatch[1] : "DOC";

  return { numero, tipo, rest: after, status };
}

interface DocListProps {
  source: string;
  onDocClick?: (id: string, tipo: string) => void;
}

export default function DocList({ source, onDocClick }: DocListProps) {
  const lines = source.split(/\r?\n/);
  const parsed = lines
    .map(parseDocLine)
    .filter((p): p is NonNullable<typeof p> => p !== null);

  if (parsed.length === 0) {
    return (
      <pre className="my-2 overflow-x-auto rounded-md bg-neutral-100 p-2 text-[12px] text-neutral-800">
        <code>{source}</code>
      </pre>
    );
  }

  return (
    <div className="my-2 flex flex-col gap-1.5">
      {parsed.map(({ numero, tipo, rest, status }, i) => {
        const statusClass =
          STATUS_TONE[status] ?? "border-neutral-200 bg-neutral-50 text-neutral-600";
        const typeShort = TYPE_LABEL[tipo] ?? tipo.slice(0, 3).toUpperCase();

        return (
          <button
            key={`${numero}-${i}`}
            type="button"
            onClick={() => onDocClick?.(numero, tipo.toLowerCase())}
            disabled={!onDocClick}
            className="group flex w-full min-w-0 items-start gap-2.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-left text-[12px] transition hover:border-[#75141C]/40 hover:bg-[#75141C]/5 active:scale-[0.99] disabled:cursor-default disabled:opacity-70"
          >
            {/* Type badge */}
            <span className="mt-0.5 shrink-0 rounded border border-neutral-200 bg-neutral-100 px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-wider text-neutral-500">
              {typeShort}
            </span>

            {/* Number + rest */}
            <div className="min-w-0 flex-1">
              <span className="font-mono font-semibold text-[#75141C]">{numero}</span>
              <span className="ml-2 min-w-0 truncate text-neutral-600">
                {/* Show just the middle parts (skip first which is TYPE and last which is STATUS) */}
                {rest
                  .split("·")
                  .slice(1, -1)
                  .join(" · ")
                  .trim() || rest.split("·").slice(1).join(" · ").trim()}
              </span>
            </div>

            {/* Status pill */}
            {status && (
              <span
                className={`mt-0.5 shrink-0 rounded-full border px-2 py-px text-[9px] font-semibold uppercase tracking-wide ${statusClass}`}
              >
                {status}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
