import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { HiChevronLeft, HiChevronRight, HiXMark } from "react-icons/hi2";
import * as api from "../../lib/remusaApi";

export interface PartDetailPayload {
  codigo: string;
  descripcion: string;
  categoria?: string;
  dimensiones?: string;
  unidad?: string;
  precios?: { mayoreo?: number; detalle?: number };
  moneda?: string;
  bodegas?: Array<{ codigo?: string; nombre?: string; disponible?: number }>;
  aliases?: string[];
  alternos?: string[];
  epc?: string;
  oem_part_number?: string;
}

function numOrUndef(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(String(v).replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

export function parsePartDetail(json: unknown): PartDetailPayload | null {
  if (json == null || typeof json !== "object" || Array.isArray(json)) return null;
  const o = json as Record<string, unknown>;
  const codigo = String(o.codigo ?? "").trim();
  const descripcion = String(o.descripcion ?? "").trim();
  if (!codigo || !descripcion) return null;

  let precios: PartDetailPayload["precios"];
  if (o.precios && typeof o.precios === "object" && !Array.isArray(o.precios)) {
    const p = o.precios as Record<string, unknown>;
    precios = {
      mayoreo: numOrUndef(p.mayoreo),
      detalle: numOrUndef(p.detalle),
    };
  }

  let bodegas: PartDetailPayload["bodegas"];
  if (Array.isArray(o.bodegas)) {
    bodegas = o.bodegas
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const r = row as Record<string, unknown>;
        return {
          codigo: r.codigo != null ? String(r.codigo) : undefined,
          nombre: r.nombre != null ? String(r.nombre) : undefined,
          disponible: numOrUndef(r.disponible),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }

  const aliases = Array.isArray(o.aliases)
    ? o.aliases.map((a) => String(a).trim()).filter(Boolean)
    : undefined;
  const alternos = Array.isArray(o.alternos)
    ? o.alternos.map((a) => String(a).trim()).filter(Boolean)
    : undefined;

  const epc = o.epc != null ? String(o.epc).trim() : undefined;
  const oem =
    o.oem_part_number != null
      ? String(o.oem_part_number).trim()
      : undefined;

  return {
    codigo,
    descripcion,
    categoria: o.categoria != null ? String(o.categoria).trim() : undefined,
    dimensiones: o.dimensiones != null ? String(o.dimensiones).trim() : undefined,
    unidad: o.unidad != null ? String(o.unidad).trim() : undefined,
    precios,
    moneda: o.moneda != null ? String(o.moneda).trim() : undefined,
    bodegas,
    aliases,
    alternos,
    epc: epc || undefined,
    oem_part_number: oem || undefined,
  };
}

const money = (n: number | undefined, currency: string) => {
  if (n == null || !Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: currency || "CRC",
      minimumFractionDigits: 2,
    }).format(n);
  } catch {
    return `₡${n.toLocaleString("es-CR", { minimumFractionDigits: 2 })}`;
  }
};

interface PartDetailCardProps {
  data: PartDetailPayload;
  onAskCompatibleVehicles?: (code: string) => void;
}

const ALIAS_PREVIEW = 8;

export default function PartDetailCard({ data, onAskCompatibleVehicles }: PartDetailCardProps) {
  const [aliasExpanded, setAliasExpanded] = useState(false);
  const [altExpanded, setAltExpanded] = useState(false);
  const [illusUrls, setIllusUrls] = useState<string[]>([]);
  const [illusLoading, setIllusLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  const currency = data.moneda?.trim() || "CRC";

  useEffect(() => {
    const partNumber = (data.oem_part_number?.trim() || data.codigo.trim());
    if (!partNumber) {
      setIllusUrls([]);
      setIllusLoading(false);
      return;
    }
    let cancelled = false;
    setIllusLoading(true);
    (async () => {
      try {
        let resolvedEpc = data.epc?.trim() || "";
        if (!resolvedEpc) {
          const search = await api.partsSearchExact(partNumber);
          if (cancelled) return;
          const results = Array.isArray(search.results) ? search.results : [];
          for (const r of results) {
            if (!r || typeof r !== "object") continue;
            const row = r as Record<string, unknown>;
            const e = String(row.Epc ?? row.epc ?? "").trim();
            if (e) {
              resolvedEpc = e;
              break;
            }
          }
        }
        if (cancelled) return;
        if (!resolvedEpc) {
          setIllusUrls([]);
          return;
        }
        const payload = await api.partsIllustration({
          epc: resolvedEpc,
          part_number: partNumber,
        });
        if (cancelled) return;
        const urls = api.illustrationImageUrls(
          resolvedEpc,
          payload as Record<string, unknown>,
        );
        setIllusUrls(urls);
      } catch {
        if (!cancelled) setIllusUrls([]);
      } finally {
        if (!cancelled) setIllusLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data.codigo, data.epc, data.oem_part_number]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
    },
    [],
  );

  useEffect(() => {
    if (!lightboxOpen) return;
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxOpen, onKeyDown]);

  const bodegas = data.bodegas ?? [];
  const totalDisp = bodegas.reduce((s, r) => s + (Number(r.disponible) || 0), 0);

  const aliases = data.aliases ?? [];
  const shownAliases = aliasExpanded ? aliases : aliases.slice(0, ALIAS_PREVIEW);
  const aliasExtra = Math.max(0, aliases.length - ALIAS_PREVIEW);

  const alternos = data.alternos ?? [];
  const shownAlternos = altExpanded ? alternos : alternos.slice(0, ALIAS_PREVIEW);
  const altExtra = Math.max(0, alternos.length - ALIAS_PREVIEW);

  const lightbox =
    lightboxOpen && illusUrls.length > 0
      ? createPortal(
          <AnimatePresence>
            <motion.div
              key="part-detail-lightbox"
              role="dialog"
              aria-modal="true"
              aria-label="Diagramas EPC"
              className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setLightboxOpen(false)}
            >
              <motion.div
                className="relative flex max-h-[min(92dvh,920px)] w-full max-w-[min(96vw,1200px)] flex-col items-center justify-center"
                initial={{ scale: 0.97, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.97, opacity: 0 }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setLightboxOpen(false)}
                  className="absolute -right-1 -top-1 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-neutral-900/90 text-white shadow-lg backdrop-blur-sm transition hover:bg-neutral-800 sm:right-0 sm:top-0"
                  aria-label="Cerrar"
                >
                  <HiXMark className="h-6 w-6" />
                </button>
                <img
                  src={illusUrls[lightboxIdx]}
                  alt={`Diagrama ${lightboxIdx + 1}/${illusUrls.length}`}
                  className="max-h-[min(82dvh,800px)] w-full object-contain"
                  decoding="async"
                />
                {illusUrls.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxIdx(
                          (i) => (i - 1 + illusUrls.length) % illusUrls.length,
                        )
                      }
                      className="absolute top-1/2 left-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25"
                      aria-label="Anterior"
                    >
                      <HiChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxIdx((i) => (i + 1) % illusUrls.length)
                      }
                      className="absolute top-1/2 right-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25"
                      aria-label="Siguiente"
                    >
                      <HiChevronRight className="h-6 w-6" />
                    </button>
                    <div className="mt-4 flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                      {illusUrls.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setLightboxIdx(i)}
                          className={`h-2 rounded-full transition-all ${
                            i === lightboxIdx ? "w-5 bg-white" : "w-2 bg-white/40"
                          }`}
                          aria-label={`Imagen ${i + 1}`}
                        />
                      ))}
                      <span className="ml-1 text-[11px] text-white/60">
                        {lightboxIdx + 1}/{illusUrls.length}
                      </span>
                    </div>
                  </>
                ) : null}
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )
      : null;

  return (
    <>
      {lightbox}
      <div className="my-2 w-full min-w-0 overflow-hidden rounded-2xl border border-neutral-200/90 bg-neutral-50 shadow-sm">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/15 bg-linear-to-b from-[#8f2330] to-[#75141C] px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold leading-tight text-white sm:text-[13px]">
              <span className="font-normal text-white/55">Parte REMUSA · </span>
              <span className="break-all font-mono">{data.codigo}</span>
            </p>
            <span className="mt-1.5 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white sm:text-[10px]">
              en remusa
            </span>
          </div>
        </div>

        <div className="space-y-3 px-3 py-3 sm:px-4 sm:py-4">
          <div>
            <p className="text-[13px] font-semibold leading-snug text-neutral-900">
              {data.descripcion}
            </p>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-neutral-500">
              {data.categoria ? <span>{data.categoria}</span> : null}
              {data.unidad ? (
                <span>
                  Unidad: <span className="text-neutral-700">{data.unidad}</span>
                </span>
              ) : null}
            </div>
            {data.dimensiones ? (
              <p className="mt-1.5 text-[11px] text-neutral-600">
                <span className="font-medium text-neutral-700">Dimensiones: </span>
                {data.dimensiones}
              </p>
            ) : null}
          </div>

          {data.precios &&
          (data.precios.mayoreo != null || data.precios.detalle != null) ? (
            <div className="rounded-xl border border-neutral-200/80 bg-white px-3 py-2.5">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#75141C]/90">
                Precios
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                {data.precios.mayoreo != null ? (
                  <div className="flex flex-1 items-center justify-between gap-2 rounded-lg bg-neutral-50 px-2.5 py-2 text-[12px]">
                    <span className="text-neutral-500">Mayoreo</span>
                    <span className="font-mono font-semibold text-neutral-900">
                      {money(data.precios.mayoreo, currency)}
                    </span>
                  </div>
                ) : null}
                {data.precios.detalle != null ? (
                  <div className="flex flex-1 items-center justify-between gap-2 rounded-lg bg-neutral-50 px-2.5 py-2 text-[12px]">
                    <span className="text-neutral-500">Detalle</span>
                    <span className="font-mono font-semibold text-neutral-900">
                      {money(data.precios.detalle, currency)}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {bodegas.length > 0 ? (
            <div className="rounded-xl border border-neutral-200/80 bg-white px-3 py-2.5">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#75141C]/90">
                Stock por bodega
              </p>
              <ul className="max-h-40 space-y-1.5 overflow-auto text-[11px] text-neutral-800">
                {bodegas.map((row, i) => (
                  <li
                    key={`${row.codigo}-${i}`}
                    className="flex flex-wrap items-baseline gap-x-2 border-b border-neutral-100 pb-1 last:border-0"
                  >
                    {row.codigo ? (
                      <span className="font-mono font-medium">{row.codigo}</span>
                    ) : null}
                    <span className="min-w-0 flex-1 text-neutral-600">
                      {row.nombre ?? "—"}
                    </span>
                    <span className="shrink-0">
                      Disp:{" "}
                      <span className="font-medium">
                        {row.disponible ?? "—"}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              {totalDisp > 0 ? (
                <p className="mt-2 border-t border-neutral-100 pt-2 text-[11px] font-medium text-neutral-800">
                  Total disponible: {totalDisp}
                </p>
              ) : null}
            </div>
          ) : null}

          {illusLoading ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[1, 2, 3].map((k) => (
                <div
                  key={k}
                  className="h-20 w-24 shrink-0 animate-pulse rounded-lg bg-neutral-200"
                />
              ))}
            </div>
          ) : illusUrls.length > 0 ? (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#75141C]/90">
                Diagrama
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {illusUrls.map((url, i) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => {
                      setLightboxIdx(i);
                      setLightboxOpen(true);
                    }}
                    className="h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-white transition hover:border-[#75141C]/40 hover:ring-2 hover:ring-[#75141C]/20"
                  >
                    <img
                      src={url}
                      alt={`Miniatura ${i + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {aliases.length > 0 ? (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                Referencias (aliases)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {shownAliases.map((a) => (
                  <span
                    key={a}
                    className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 font-mono text-[11px] text-neutral-700"
                  >
                    {a}
                  </span>
                ))}
              </div>
              {!aliasExpanded && aliasExtra > 0 ? (
                <button
                  type="button"
                  onClick={() => setAliasExpanded(true)}
                  className="mt-2 text-[11px] font-medium text-[#75141C] hover:underline"
                >
                  ver más (+{aliasExtra})
                </button>
              ) : null}
            </div>
          ) : null}

          {alternos.length > 0 ? (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                Alternos
              </p>
              <div className="flex flex-wrap gap-1.5">
                {shownAlternos.map((a) => (
                  <span
                    key={a}
                    className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 font-mono text-[11px] text-neutral-700"
                  >
                    {a}
                  </span>
                ))}
              </div>
              {!altExpanded && altExtra > 0 ? (
                <button
                  type="button"
                  onClick={() => setAltExpanded(true)}
                  className="mt-2 text-[11px] font-medium text-[#75141C] hover:underline"
                >
                  ver más (+{altExtra})
                </button>
              ) : null}
            </div>
          ) : null}
          {onAskCompatibleVehicles ? (
            <button
              type="button"
              onClick={() =>
                onAskCompatibleVehicles(data.oem_part_number?.trim() || data.codigo)
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#75141C]/25 bg-white px-3 py-2.5 text-[12px] font-medium text-[#75141C] transition hover:border-[#75141C]/40 hover:bg-[#75141C]/5 active:scale-[0.99]"
            >
              Ver vehículos compatibles
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}
