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
  bodegas?: Array<{
    codigo?: string;
    nombre?: string;
    disponible?: number;
    pedida?: number;
    transito?: number;
    reservada?: number;
  }>;
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
          pedida: numOrUndef(r.pedida),
          transito: numOrUndef(r.transito),
          reservada: numOrUndef(r.reservada),
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

  // `null` = not yet attempted; `false` = tried, no diagrams; otherwise an
  // array of image URLs. Drives the "Diagramas no disponibles" caption.
  const [illusAttempted, setIllusAttempted] = useState(false);

  useEffect(() => {
    // Pick candidate part numbers in priority order:
    //   1. The OEM number the model knew about (if set)
    //   2. The first alias that *looks* OEM-shaped (has a dash, or all
    //      alphanumeric ≥6 chars) — REMUSA's ARTICULO codes are typically
    //      not in 17VIN's catalog, but aliases often are.
    //   3. The REMUSA codigo itself (last resort)
    const candidates: string[] = [];
    if (data.oem_part_number?.trim()) candidates.push(data.oem_part_number.trim());
    const aliases = data.aliases ?? [];
    const oemShaped = aliases.filter((a) => {
      const s = a.trim();
      if (!s) return false;
      if (/[-]/.test(s) && /\d/.test(s)) return true;
      return /^[A-Z0-9]{6,}$/i.test(s);
    });
    for (const a of oemShaped) {
      if (!candidates.includes(a)) candidates.push(a);
    }
    if (data.codigo.trim() && !candidates.includes(data.codigo.trim())) {
      candidates.push(data.codigo.trim());
    }

    if (candidates.length === 0) {
      setIllusUrls([]);
      setIllusLoading(false);
      setIllusAttempted(true);
      return;
    }

    let cancelled = false;
    setIllusLoading(true);
    setIllusAttempted(false);

    (async () => {
      let resolvedEpc = data.epc?.trim() || "";
      let resolvedPn = candidates[0];

      // Step 1: resolve an EPC by trying each candidate against partsSearchExact.
      if (!resolvedEpc) {
        for (const pn of candidates) {
          try {
            const search = await api.partsSearchExact(pn);
            if (cancelled) return;
            const results = Array.isArray(search.results) ? search.results : [];
            for (const r of results) {
              if (!r || typeof r !== "object") continue;
              const row = r as Record<string, unknown>;
              const e = String(row.Epc ?? row.epc ?? "").trim();
              if (e) {
                resolvedEpc = e;
                resolvedPn = pn;
                break;
              }
            }
            if (resolvedEpc) break;
          } catch {
            // try next candidate
          }
        }
      }

      if (cancelled) return;
      if (!resolvedEpc) {
        setIllusUrls([]);
        setIllusLoading(false);
        setIllusAttempted(true);
        return;
      }

      // Step 2: fetch illustration thumbnails for the resolved (epc, pn).
      try {
        const payload = await api.partsIllustration({
          epc: resolvedEpc,
          part_number: resolvedPn,
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
        if (!cancelled) {
          setIllusLoading(false);
          setIllusAttempted(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data.codigo, data.epc, data.oem_part_number, data.aliases]);

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

  const allBodegas = data.bodegas ?? [];
  // Only show warehouses that actually have something happening: stock on
  // hand, an incoming PO, or in-transit shipment. Drops the noise of dozens
  // of all-zero rows while still surfacing "0 disp, 3 en tránsito" cases.
  const bodegas = allBodegas.filter(
    (r) =>
      (r.disponible ?? 0) > 0 ||
      (r.pedida ?? 0) > 0 ||
      (r.transito ?? 0) > 0,
  );
  const totalDisp = bodegas.reduce((s, r) => s + (Number(r.disponible) || 0), 0);
  const totalPedida = bodegas.reduce((s, r) => s + (Number(r.pedida) || 0), 0);
  const totalTransito = bodegas.reduce((s, r) => s + (Number(r.transito) || 0), 0);

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

          {/* Precios — always render the section. Empty values show "—" so
              the card looks consistent across parts. */}
          <div className="rounded-xl border border-neutral-200/80 bg-white px-3 py-2.5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#75141C]/90">
              Precios
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <div className="flex flex-1 items-center justify-between gap-2 rounded-lg bg-neutral-50 px-2.5 py-2 text-[12px]">
                <span className="text-neutral-500">Mayoreo</span>
                <span className="font-mono font-semibold text-neutral-900">
                  {data.precios?.mayoreo != null
                    ? money(data.precios.mayoreo, currency)
                    : "—"}
                </span>
              </div>
              <div className="flex flex-1 items-center justify-between gap-2 rounded-lg bg-neutral-50 px-2.5 py-2 text-[12px]">
                <span className="text-neutral-500">Detalle</span>
                <span className="font-mono font-semibold text-neutral-900">
                  {data.precios?.detalle != null
                    ? money(data.precios.detalle, currency)
                    : "—"}
                </span>
              </div>
            </div>
            {(data.precios?.mayoreo == null && data.precios?.detalle == null) ? (
              <p className="mt-2 text-[11px] italic text-neutral-500">
                Sin precios registrados.
              </p>
            ) : null}
          </div>

          {/* Stock — only warehouses with stock on hand, on order, or in
              transit. If nothing anywhere, show a single explanatory line. */}
          <div className="rounded-xl border border-neutral-200/80 bg-white px-3 py-2.5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#75141C]/90">
              Stock por bodega
            </p>
            {bodegas.length > 0 ? (
              <>
                <ul className="max-h-56 space-y-1.5 overflow-auto text-[11px] text-neutral-800">
                  {bodegas.map((row, i) => {
                    const disp = row.disponible ?? 0;
                    const pedida = row.pedida ?? 0;
                    const transito = row.transito ?? 0;
                    return (
                      <li
                        key={`${row.codigo}-${i}`}
                        className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-neutral-100 pb-1 last:border-0"
                      >
                        {row.codigo ? (
                          <span className="font-mono font-medium">{row.codigo}</span>
                        ) : null}
                        <span className="min-w-0 flex-1 text-neutral-600">
                          {row.nombre ?? "—"}
                        </span>
                        <span className="shrink-0">
                          Disp:{" "}
                          <span
                            className={`font-medium ${
                              disp > 0 ? "text-neutral-900" : "text-neutral-400"
                            }`}
                          >
                            {disp}
                          </span>
                        </span>
                        {transito > 0 ? (
                          <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                            +{transito} en tránsito
                          </span>
                        ) : null}
                        {pedida > 0 ? (
                          <span className="shrink-0 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">
                            +{pedida} pedida
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
                <p
                  className={`mt-2 border-t border-neutral-100 pt-2 text-[11px] font-medium ${
                    totalDisp > 0 ? "text-neutral-800" : "text-neutral-500"
                  }`}
                >
                  Total disponible:{" "}
                  <span className={totalDisp > 0 ? "text-neutral-900" : ""}>
                    {totalDisp}
                  </span>
                  {totalTransito > 0 ? (
                    <span className="ml-2 text-amber-700">
                      · {totalTransito} en tránsito
                    </span>
                  ) : null}
                  {totalPedida > 0 ? (
                    <span className="ml-2 text-blue-700">
                      · {totalPedida} pedida
                    </span>
                  ) : null}
                </p>
              </>
            ) : (
              <p className="text-[11px] italic text-neutral-500">
                Sin stock disponible y sin órdenes pendientes.
              </p>
            )}
          </div>

          {illusLoading ? (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#75141C]/90">
                Diagrama
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[1, 2, 3].map((k) => (
                  <div
                    key={k}
                    className="h-20 w-24 shrink-0 animate-pulse rounded-lg bg-neutral-200"
                  />
                ))}
              </div>
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
          ) : illusAttempted ? (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                Diagrama
              </p>
              <p className="text-[11px] italic text-neutral-400">
                Diagramas no disponibles para este artículo.
              </p>
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
