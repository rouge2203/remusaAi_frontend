import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { HiXMark } from "react-icons/hi2";
import type { PartResult, RemusaHit } from "../../types";
import * as api from "../../lib/remusaApi";
import TerminalLoader from "../search/TerminalLoader";
import {
  PART_DETAIL_LOADING_MESSAGES,
  PART_DETAIL_REMUSA_DETAIL_MESSAGES,
  type PartDetailLoadingKey,
} from "../../constants/catalogLoadingMessages";
import { PART_DETAIL_MENU_MATCH, PART_DETAIL_MENU_NOMATCH } from "../../constants/partDetailSheetMenu";
import type { MenuItem } from "../../constants/remusaMenu";
import { MenuTerminalRow } from "../menu/MenuTerminalRow";
import { PartMedia } from "./PartMedia";
import {
  oeStr,
  moneyCRC,
  moneyUSD,
  DetailRow,
  SheetSection,
  VehicleListView,
  TecdocResultView,
} from "./PartDetailShared";

type EquivRow = Record<string, unknown>;

export default function PartSearchDetailSheet({
  open,
  onClose,
  part,
  remusaHit,
  directOnly,
}: {
  open: boolean;
  onClose: () => void;
  part: PartResult | null;
  remusaHit: RemusaHit | null;
  directOnly: boolean;
}) {
  const [enrichedPart, setEnrichedPart] = useState<Record<string, unknown>>({});
  const [remusaDetail, setRemusaDetail] = useState<Record<string, unknown> | null>(null);
  const [remusaLoading, setRemusaLoading] = useState(false);
  const [actionKey, setActionKey] = useState<PartDetailLoadingKey | null>(null);
  const [actionPayload, setActionPayload] = useState<unknown>(null);
  const [lastActionId, setLastActionId] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [equivRows, setEquivRows] = useState<EquivRow[] | null>(null);
  const [equivNote, setEquivNote] = useState<string | null>(null);
  const [collapseDetailSections, setCollapseDetailSections] = useState(false);

  const pn = directOnly
    ? (remusaHit?.articulo ?? "")
    : (part?.partNumber ?? "");

  const articuloResolved =
    (remusaHit?.articulo && String(remusaHit.articulo).trim()) ||
    (remusaDetail?.articulo && String(remusaDetail.articulo).trim()) ||
    "";
  const hasRemusa = Boolean(remusaHit?.articulo);
  const hasRemusaEffective = Boolean(articuloResolved);

  const loadRemusaDetail = useCallback(async (code: string) => {
    if (!code) return;
    setRemusaLoading(true);
    try {
      const d = await api.remusaDetail(code);
      setRemusaDetail(d as Record<string, unknown>);
    } catch {
      setRemusaDetail(null);
    } finally {
      setRemusaLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setEnrichedPart({});
      setRemusaDetail(null);
      setActionKey(null);
      setActionPayload(null);
      setLastActionId(null);
      setActionErr(null);
      setEquivRows(null);
      setEquivNote(null);
      setCollapseDetailSections(false);
      return;
    }

    setRemusaDetail(null);
    setActionKey(null);
    setActionPayload(null);
    setLastActionId(null);
    setActionErr(null);
    setEquivRows(null);
    setEquivNote(null);
    setCollapseDetailSections(false);

    if (remusaHit?.articulo) void loadRemusaDetail(remusaHit.articulo);

    if (part && !directOnly) {
      setEnrichedPart({});
      void api
        .partsSearchExact(part.partNumber)
        .then((r) => {
          const first = (r.results as Array<Record<string, unknown>>)?.[0];
          if (first) setEnrichedPart(first);
        })
        .catch(() => {});
    }
  }, [open, part, remusaHit?.articulo, loadRemusaDetail, directOnly]);

  const ep = enrichedPart;
  const nameEn = part?.partNameEn || oeStr(ep, "name_en", "Name_en", "Part_name_en");
  const nameZh = part?.partNameZh || oeStr(ep, "name_zh", "Name_zh", "Part_name_zh");
  const brandEn = part?.brandNameEn || oeStr(ep, "Brand_name_en", "brand_name_en");
  const epc = part?.epc || oeStr(ep, "Epc", "epc");
  const groupId = part?.groupId || oeStr(ep, "Group_id", "group_id");

  const runAction = async (key: PartDetailLoadingKey, id: string, fn: () => Promise<unknown>) => {
    setCollapseDetailSections(true);
    setActionKey(key);
    setLastActionId(id);
    setActionErr(null);
    try {
      setActionPayload(await fn());
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "Error");
      setActionPayload(null);
    } finally {
      setActionKey(null);
    }
  };

  const onEquivSearch = async () => {
    if (!pn) return;
    setCollapseDetailSections(true);
    setActionKey("e");
    setLastActionId("e");
    setActionErr(null);
    setEquivRows(null);
    setEquivNote(null);
    try {
      const r = await api.remusaEquivSearch(pn);
      const matches = (r.matches as EquivRow[]) ?? [];
      setEquivRows(matches);
      setEquivNote(
        matches.length === 0
          ? "Ninguna equivalencia encontrada en REMUSA."
          : `${matches.length} equivalencia(s) en REMUSA.`,
      );
      setActionPayload(r);
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "Error");
      setEquivRows(null);
    } finally {
      setActionKey(null);
    }
  };

  const onSelectEquiv = (row: EquivRow) => {
    const art = String(row.articulo ?? "").trim();
    if (art) void loadRemusaDetail(art);
  };

  const onMenuSelect = (item: MenuItem) => {
    if (!pn || actionKey != null) return;
    const fallback =
      hasRemusaEffective && articuloResolved ? [pn, articuloResolved].filter(Boolean).join(",") : undefined;
    if (item.id === "e") {
      void onEquivSearch();
      return;
    }
    const key = item.id as PartDetailLoadingKey;
    if (key === "t") {
      void runAction("t", "t", () => api.tecdocPartLookup(pn, fallback));
    } else if (key === "1") {
      void runAction("1", "1", () => api.partsSearchExact(pn));
    } else if (key === "2") {
      void runAction("2", "2", () => api.partsInterchange(pn).then((r) => r.data));
    } else if (key === "3") {
      void runAction("3", "3", () => api.partsVehicles(pn).then((r) => r.data));
    } else if (key === "4") {
      void runAction("4", "4", () => api.partsVehiclesAftermarket(pn).then((r) => r.data));
    } else if (key === "5") {
      void runAction("5", "5", () => api.partsPrice(pn).then((r) => r.prices));
    } else if (key === "6") {
      void runAction("6", "6", () => api.partsIllustration({ epc: epc || "unknown", part_number: pn }));
    }
  };

  const vehicleListData = useMemo(() => {
    if (actionPayload == null || actionKey != null) return null;
    if (lastActionId !== "3" && lastActionId !== "4") return null;
    const d = actionPayload as Record<string, unknown>;
    const list =
      (d.ModelListStd as Array<Record<string, unknown>>) ??
      (d.ModelListStd_aftermarket_by_engine as Array<Record<string, unknown>>) ??
      null;
    if (!list || !Array.isArray(list) || list.length === 0) return null;
    return { vehicles: list, mode: lastActionId as "3" | "4" };
  }, [actionPayload, actionKey, lastActionId]);

  const tecdocData = useMemo(() => {
    if (actionPayload == null || actionKey != null || lastActionId !== "t") return null;
    const d = actionPayload as Record<string, unknown>;
    const articles = d.articles as Array<Record<string, unknown>> | undefined;
    if (!articles || articles.length === 0) return null;
    return d;
  }, [actionPayload, actionKey, lastActionId]);

  if (!open || (!part && !directOnly)) return null;

  const costos = remusaDetail?.costos as Record<string, number> | undefined;
  const c1 = remusaDetail?.clasificacion_1 as { codigo?: string; descripcion?: string } | undefined;
  const c2 = remusaDetail?.clasificacion_2 as { codigo?: string; descripcion?: string } | undefined;
  const inv = (remusaDetail?.inventario as Array<Record<string, unknown>>) ?? [];

  const menuItems = hasRemusaEffective ? PART_DETAIL_MENU_MATCH : PART_DETAIL_MENU_NOMATCH;
  const showRemusaColumn = (hasRemusa && remusaHit) || remusaLoading || remusaDetail;

  const remusaBlock = (
    <SheetSection title="REMUSA" collapseSignal={collapseDetailSections}>
      {remusaLoading ? (
        <TerminalLoader messages={[...PART_DETAIL_REMUSA_DETAIL_MESSAGES]} active variant="light" />
      ) : remusaDetail ? (
        <>
          <DetailRow label="Código" value={String(remusaDetail.articulo ?? "")} highlight />
          <DetailRow label="Descripción" value={String(remusaDetail.descripcion ?? "")} />
          <DetailRow
            label="Activo"
            value={remusaDetail.activo === true ? "Sí" : remusaDetail.activo === false ? "No" : ""}
          />
          {c1?.codigo ? (
            <DetailRow label="Familia" value={`${c1.codigo} — ${c1.descripcion ?? ""}`.trim()} />
          ) : null}
          {c2?.codigo ? (
            <DetailRow label="Sub-familia" value={`${c2.codigo} — ${c2.descripcion ?? ""}`.trim()} />
          ) : null}
          <DetailRow label="Proveedor" value={String(remusaDetail.proveedor ?? "")} />
          <DetailRow label="Art. del proveedor" value={String(remusaDetail.articulo_del_proveedor ?? "")} />
          <DetailRow
            label="Unidad almacén / venta"
            value={`${String(remusaDetail.unidad_almacen ?? "")} / ${String(remusaDetail.unidad_venta ?? "")}`}
          />
          {costos ? (
            <div className="mt-2 border-t border-neutral-200 pt-2">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#75141C]/90">
                Costos y precios
              </p>
              <DetailRow label="Costo último" value={`${moneyCRC(costos.ultimo_local ?? 0)} · ${moneyUSD(costos.ultimo_dolar ?? 0)}`} />
              <DetailRow label="Costo promedio" value={`${moneyCRC(costos.promedio_local ?? 0)} · ${moneyUSD(costos.promedio_dolar ?? 0)}`} />
              <DetailRow label="Precio base" value={`${moneyCRC(costos.precio_base_local ?? 0)} · ${moneyUSD(costos.precio_base_dolar ?? 0)}`} />
            </div>
          ) : null}
          {inv.length > 0 ? (
            <div className="mt-2 max-h-40 overflow-auto border-t border-neutral-200 pt-2">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#75141C]/90">
                Inventario por bodega
              </p>
              <ul className="space-y-1 text-[10px] text-neutral-800">
                {inv.map((row, i) => (
                  <li key={i} className="flex flex-wrap gap-x-2 border-b border-neutral-100/80 pb-1">
                    <span className="font-medium">{String(row.bodega)}</span>
                    <span className="text-neutral-500">{String(row.nombre)}</span>
                    <span>Disp: {String(row.disponible)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-[11px] text-neutral-600">Sin detalle extendido.</p>
      )}
    </SheetSection>
  );

  const oeBlock = !directOnly ? (
    <SheetSection title="Info OE (17VIN)" collapseSignal={collapseDetailSections}>
      <DetailRow label="Número OE" value={pn} />
      <DetailRow label="Nombre (EN)" value={nameEn} />
      <DetailRow label="Nombre (ZH)" value={nameZh} />
      {brandEn ? <DetailRow label="Marcas" value={brandEn} /> : null}
      {epc ? <DetailRow label="EPC" value={epc} /> : null}
      {groupId ? <DetailRow label="Group ID" value={groupId} /> : null}
      {hasRemusa && remusaHit ? <DetailRow label="Match via" value={remusaHit.source} highlight /> : null}
    </SheetSection>
  ) : null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="part-search-sheet"
          role="dialog"
          aria-modal="true"
          aria-label={directOnly ? "Detalle REMUSA" : "Detalle parte"}
          className="fixed inset-0 z-65 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="flex max-h-[min(92dvh,920px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] bg-[#ececf0] shadow-[0_40px_100px_-50px_rgba(0,0,0,0.55)] sm:max-h-[min(88dvh,880px)] sm:max-w-3xl sm:rounded-[28px] lg:max-w-5xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/15 bg-linear-to-b from-[#8f2330] to-[#75141C] px-4 py-3 sm:rounded-t-[28px]">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold leading-tight text-white">
                  <span className="font-normal text-white/55">
                    {directOnly ? "REMUSA · " : "Parte · "}
                  </span>
                  <span className="break-all">{pn || "—"}</span>
                </p>
                {hasRemusaEffective ? (
                  <span className="mt-2 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    ★ en remusa
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 text-white/90 transition hover:bg-white/10"
                aria-label="Cerrar"
              >
                <HiXMark className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 sm:py-4">
              <div
                className={
                  showRemusaColumn && !directOnly
                    ? "grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start"
                    : "flex flex-col gap-3"
                }
              >
                {showRemusaColumn ? <div className="min-w-0 space-y-3">{remusaBlock}</div> : null}
                {oeBlock ? (
                  <div className="min-w-0 space-y-3">{oeBlock}</div>
                ) : null}
              </div>

              {!directOnly && !showRemusaColumn && !hasRemusa && !remusaDetail ? (
                <p className="rounded-xl border border-neutral-200/80 bg-white px-3 py-2 text-[11px] text-neutral-500 shadow-sm">
                  No encontrada en REMUSA (directa). Use equivalencias en el menú de acciones.
                </p>
              ) : null}

              {equivNote ? (
                <p
                  className={`rounded-xl border px-3 py-2 text-[11px] shadow-sm ${
                    equivRows?.length
                      ? "border-[#75141C]/20 bg-[#75141C]/5 text-[#75141C]"
                      : "border-amber-200/80 bg-amber-50/90 text-amber-900"
                  }`}
                >
                  {equivRows?.length ? "✔ " : "⚠ "}
                  {equivNote}
                </p>
              ) : null}
              {equivRows && equivRows.length > 0 ? (
                <ul className="flex flex-col gap-1.5">
                  {equivRows.map((row, i) => {
                    const eqPn = String(row.part_number ?? row.pn ?? i);
                    const art = String(row.articulo ?? "").trim();
                    return (
                      <li key={`${eqPn}-${i}`}>
                        <button
                          type="button"
                          onClick={() => onSelectEquiv(row)}
                          className="w-full rounded-xl border border-[#75141C]/25 bg-white px-3 py-2 text-left text-[11px] text-[#75141C] shadow-sm transition hover:border-[#75141C]/40 hover:bg-[#75141C]/5"
                        >
                          <span className="font-semibold text-neutral-900">{eqPn}</span>
                          {art ? <span className="mt-0.5 block text-neutral-600">→ {art}</span> : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              {!directOnly ? (
                <div className="overflow-hidden rounded-[24px] bg-linear-to-b from-[#8f2330] to-[#75141C] shadow-[0_12px_32px_-16px_rgba(0,0,0,0.4)]">
                  <div className="flex shrink-0 items-start justify-between gap-2 border-b border-white/15 px-3 py-2">
                    <p className="pt-0.5 text-[10px] font-medium uppercase tracking-widest text-white/45">
                      {"> detalle parte · acciones"}
                    </p>
                  </div>
                  <div className="p-3 pt-2">
                    <ul className="flex flex-col gap-1">
                      {menuItems.map((item) => (
                        <li key={item.id}>
                          <MenuTerminalRow
                            item={item}
                            onSelect={onMenuSelect}
                            variant="dark"
                            disabled={!pn || actionKey != null}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}

              {actionKey ? (
                <TerminalLoader
                  messages={[...PART_DETAIL_LOADING_MESSAGES[actionKey]]}
                  active
                  variant="light"
                />
              ) : null}
              {actionErr ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 shadow-sm">
                  {actionErr}
                </div>
              ) : null}
              {actionPayload != null && !actionKey ? (
                <div className="rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#75141C]">
                    Resultado
                  </p>
                  <div className="mt-2">
                    {vehicleListData ? (
                      <VehicleListView vehicles={vehicleListData.vehicles} mode={vehicleListData.mode} />
                    ) : tecdocData ? (
                      <TecdocResultView data={tecdocData} />
                    ) : (
                      <>
                        {typeof actionPayload === "object" && actionPayload !== null ? (
                          <IllustrationMaybe epc={epc} payload={actionPayload as Record<string, unknown>} />
                        ) : null}
                        <div className="mt-2 overflow-hidden rounded-xl border border-neutral-200/80 bg-neutral-950 p-3">
                          <pre className="wrap-break-word max-h-[min(40vh,360px)] overflow-auto text-[10px] leading-relaxed text-emerald-100/95 whitespace-pre-wrap">
                            {JSON.stringify(actionPayload, null, 2)}
                          </pre>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function IllustrationMaybe({ epc, payload }: { epc: string; payload: Record<string, unknown> }) {
  const url = api.illustrationImageUrl(epc, payload);
  if (!url) return null;
  return <PartMedia src={url} alt="Ilustración" className="max-h-48 w-full object-contain" />;
}
