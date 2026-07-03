import { useEffect, useState } from "react";
import * as api from "../../lib/remusaApi";
import type { CrossItem, CrossesResponse } from "../../lib/remusaApi";
import TerminalLoader from "../search/TerminalLoader";

const CROSSES_LOADING_MESSAGES = [
  "Cruces y equivalencias...",
  "Consultando intercambio 17VIN (OEM + fábrica)...",
  "Consultando TecDoc (analogías + números OEM)...",
  "Verificando inventario REMUSA...",
];

const SOURCE_LABEL: Record<string, string> = {
  "17VIN_OE": "OE 17VIN",
  "17VIN_AFT": "AFT 17VIN",
  TECDOC_OEM: "OEM TecDoc",
  TECDOC_ART: "TecDoc",
};

const INITIAL_ROWS = 24;

function SourceChips({ sources }: { sources: string[] }) {
  return (
    <span className="flex flex-wrap items-center gap-1">
      {sources.map((s) => (
        <span
          key={s}
          className={`inline-flex items-center rounded-full px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide ${
            s === "17VIN_OE" || s === "TECDOC_OEM"
              ? "bg-[#75141C]/10 text-[#75141C]"
              : "bg-neutral-100 text-neutral-500"
          }`}
        >
          {SOURCE_LABEL[s] ?? s}
        </span>
      ))}
    </span>
  );
}

function CrossThumb({ image, alt }: { image: string | null; alt: string }) {
  if (!image) return null;
  return (
    <div className="shrink-0 overflow-hidden rounded-lg border border-neutral-200/80 bg-white">
      <img
        src={image}
        alt={alt}
        className="h-12 w-12 object-contain"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

function CrossRow({
  c,
  onSelectRemusa,
}: {
  c: CrossItem;
  onSelectRemusa?: (articulo: string) => void;
}) {
  const clickable = Boolean(c.remusa && onSelectRemusa);
  const body = (
    <div className="flex items-start gap-2.5">
      <CrossThumb image={c.image} alt={c.display} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-mono text-[11px] font-semibold text-neutral-900">
            {c.display}
          </span>
          <SourceChips sources={c.sources} />
        </div>
        {c.brands.length > 0 ? (
          <p className="mt-0.5 truncate text-[10px] text-neutral-500">
            {c.brands.slice(0, 3).join(" · ")}
            {c.names[0] ? ` — ${c.names[0]}` : ""}
          </p>
        ) : c.names[0] ? (
          <p className="mt-0.5 truncate text-[10px] text-neutral-500">{c.names[0]}</p>
        ) : null}
        {c.remusa ? (
          <p className="mt-1 font-mono text-[11px] font-semibold text-[#75141C]">
            ★ {c.remusa.articulo}
            <span className="font-normal text-neutral-600"> · {c.remusa.desc}</span>
            {c.remusa.activo === false ? (
              <span className="ml-1.5 inline-flex items-center rounded-full border border-neutral-300 bg-neutral-100 px-1.5 py-px text-[9px] font-semibold uppercase text-neutral-600">
                Inactivo
              </span>
            ) : null}
          </p>
        ) : null}
      </div>
    </div>
  );

  if (clickable) {
    return (
      <button
        type="button"
        onClick={() => onSelectRemusa!(c.remusa!.articulo)}
        className="w-full rounded-xl border border-[#75141C]/25 bg-white px-3 py-2 text-left shadow-sm transition hover:border-[#75141C]/40 hover:bg-[#75141C]/5"
      >
        {body}
      </button>
    );
  }
  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white px-3 py-2 shadow-sm">
      {body}
    </div>
  );
}

function CrossGroup({
  title,
  rows,
  onSelectRemusa,
}: {
  title: string;
  rows: CrossItem[];
  onSelectRemusa?: (articulo: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  if (rows.length === 0) return null;
  const visible = expanded ? rows : rows.slice(0, INITIAL_ROWS);
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
        {title} <span className="font-normal text-neutral-400">({rows.length})</span>
      </p>
      <ul className="flex flex-col gap-1.5">
        {visible.map((c) => (
          <li key={c.number}>
            <CrossRow c={c} onSelectRemusa={onSelectRemusa} />
          </li>
        ))}
      </ul>
      {rows.length > INITIAL_ROWS ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 w-full rounded-lg border border-neutral-200/80 bg-white px-2 py-1.5 text-[10px] font-medium text-neutral-500 shadow-sm transition hover:text-neutral-700"
        >
          {expanded ? "Ver menos" : `Ver todos (${rows.length})`}
        </button>
      ) : null}
    </div>
  );
}

/**
 * Unified cross-reference panel: fetches /api/parts/crosses/<pn>/ and shows
 * REMUSA-stocked equivalents first, then OEM and aftermarket candidates.
 */
export default function CrossesPanel({
  partNumber,
  onSelectRemusa,
}: {
  partNumber: string;
  onSelectRemusa?: (articulo: string) => void;
}) {
  const [data, setData] = useState<CrossesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!partNumber) return;
    let alive = true;
    setLoading(true);
    setError(null);
    setData(null);
    api
      .partCrosses(partNumber)
      .then((r) => {
        if (alive) setData(r);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "Error");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [partNumber]);

  if (!partNumber) return null;
  if (loading) {
    return (
      <TerminalLoader messages={CROSSES_LOADING_MESSAGES} active variant="light" />
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 shadow-sm">
        {error}
      </div>
    );
  }
  if (!data) return null;

  const inRemusa = data.crosses.filter((c) => c.remusa);
  const oemRest = data.crosses.filter(
    (c) =>
      !c.remusa &&
      c.sources.some((s) => s === "17VIN_OE" || s === "TECDOC_OEM"),
  );
  const aftRest = data.crosses.filter(
    (c) =>
      !c.remusa &&
      !c.sources.some((s) => s === "17VIN_OE" || s === "TECDOC_OEM"),
  );

  return (
    <div className="space-y-3">
      <div
        className={`rounded-xl border px-3 py-2 text-[11px] shadow-sm ${
          inRemusa.length > 0
            ? "border-[#75141C]/20 bg-[#75141C]/5 text-[#75141C]"
            : "border-amber-200/80 bg-amber-50/90 text-amber-900"
        }`}
      >
        {inRemusa.length > 0 ? "✔ " : "⚠ "}
        {data.stats.total_crosses} cruce(s) encontrados ·{" "}
        {inRemusa.length > 0
          ? `${inRemusa.length} en inventario REMUSA`
          : "ninguno en inventario REMUSA"}
      </div>

      <CrossGroup
        title="En inventario REMUSA"
        rows={inRemusa}
        onSelectRemusa={onSelectRemusa}
      />
      <CrossGroup title="Números OEM" rows={oemRest} />
      <CrossGroup title="Aftermarket" rows={aftRest} />
    </div>
  );
}
