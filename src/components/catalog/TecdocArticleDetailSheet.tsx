import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { HiArrowsPointingOut, HiChevronDown, HiXMark } from "react-icons/hi2";
import * as api from "../../lib/remusaApi";
import type { TecdocArticleRemusaEntry } from "../../lib/tecdocArticlesRemusa";
import type { MenuItem } from "../../constants/remusaMenu";
import TerminalLoader from "../search/TerminalLoader";
import {
  PART_DETAIL_LOADING_MESSAGES,
  type PartDetailLoadingKey,
} from "../../constants/catalogLoadingMessages";
import { MenuTerminalRow } from "../menu/MenuTerminalRow";
import DiagramLightbox from "./DiagramLightbox";
import { moneyCRC } from "./PartDetailShared";

const CARD =
  "rounded-2xl border border-neutral-200/90 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] overflow-hidden";

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-neutral-100 py-2.5 last:border-b-0">
      <span className="shrink-0 text-xs font-medium text-neutral-500">
        {label}
      </span>
      <span
        className={`text-right text-xs font-semibold ${highlight ? "text-[#75141C]" : "text-neutral-900"}`}
      >
        {value}
      </span>
    </div>
  );
}

function SheetSection({
  title,
  collapseSignal,
  children,
}: {
  title: string;
  collapseSignal: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (collapseSignal) setOpen(false);
  }, [collapseSignal]);
  useEffect(() => {
    if (!collapseSignal) setOpen(true);
  }, [collapseSignal]);

  return (
    <div className={CARD}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[48px] w-full items-center justify-between gap-2 px-4 py-3.5 text-left transition-colors hover:bg-neutral-50/80"
        aria-expanded={open}
      >
        <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
          {title}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-neutral-400"
        >
          <HiChevronDown className="text-xl" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.2 },
            }}
            className="overflow-hidden border-t border-neutral-100"
          >
            <div className="bg-neutral-50/80 px-4 py-3">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function extractOemCodes(article: Record<string, unknown>): string[] {
  const oems = (article.oemNo ?? article.oemNumbers) as unknown;
  if (!Array.isArray(oems)) return [];
  return oems
    .map((o) => {
      if (!o || typeof o !== "object") return "";
      const r = o as Record<string, unknown>;
      return String(r.oemDisplayNo ?? r.oemNumber ?? "").trim();
    })
    .filter(Boolean);
}

export default function TecdocArticleDetailSheet({
  open,
  onClose,
  vehicleId,
  listArticle,
  remusaEntry,
}: {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
  listArticle: Record<string, unknown> | null;
  remusaEntry: TecdocArticleRemusaEntry | null;
}) {
  const [detailWrap, setDetailWrap] = useState<Record<string, unknown> | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionKey, setActionKey] = useState<PartDetailLoadingKey | null>(null);
  const [actionPayload, setActionPayload] = useState<unknown>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [subPanel, setSubPanel] = useState<"oems" | "cars" | null>(null);
  const [imgOpen, setImgOpen] = useState(false);
  const [collapseDetailSections, setCollapseDetailSections] = useState(false);

  const articleId = listArticle ? String(listArticle.articleId ?? "") : "";
  const merged = useMemo(() => {
    const d = detailWrap?.article as Record<string, unknown> | undefined;
    const base = listArticle ?? {};
    return { ...base, ...(d ?? {}) } as Record<string, unknown>;
  }, [listArticle, detailWrap]);

  const artNo = String(merged.articleNo ?? merged.articleNumber ?? "");
  const supplier = String(merged.supplierName ?? "");
  const product = String(
    merged.articleProductName ?? merged.genericArticleDescription ?? "",
  );
  const imgUrl = String(merged.s3image ?? listArticle?.s3image ?? "");

  const oemCodes = useMemo(() => extractOemCodes(merged), [merged]);
  const cars = (merged.compatibleCars as Array<Record<string, unknown>>) ?? [];

  const [remusaDetail, setRemusaDetail] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [remusaLoading, setRemusaLoading] = useState(false);

  const articuloResolved: string =
    [remusaEntry?.hit.articulo, remusaDetail?.articulo]
      .map((v) => (v != null && v !== "" ? String(v).trim() : ""))
      .find((s) => s.length > 0) ?? "";
  const rmPn = remusaEntry?.matched_via ?? artNo;

  const loadRemusa = useCallback(async (code: string) => {
    if (!code) return;
    setRemusaLoading(true);
    try {
      setRemusaDetail(
        (await api.remusaDetail(code)) as Record<string, unknown>,
      );
    } catch {
      setRemusaDetail(null);
    } finally {
      setRemusaLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !listArticle) {
      setDetailWrap(null);
      setActionPayload(null);
      setActionErr(null);
      setSubPanel(null);
      setRemusaDetail(null);
      setCollapseDetailSections(false);
      return;
    }
    setDetailLoading(true);
    void api
      .tecdocArticleDetail(articleId)
      .then((r) => setDetailWrap(r.detail as Record<string, unknown>))
      .catch(() => setDetailWrap(null))
      .finally(() => setDetailLoading(false));

    if (remusaEntry?.hit.articulo) void loadRemusa(remusaEntry.hit.articulo);
    else setRemusaDetail(null);
  }, [open, listArticle, articleId, remusaEntry?.hit.articulo, loadRemusa]);

  const run = async (key: PartDetailLoadingKey, fn: () => Promise<unknown>) => {
    setCollapseDetailSections(true);
    setActionKey(key);
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

  const fallbackStr = [artNo, ...oemCodes].filter(Boolean).join(",");

  const onEquiv = async () => {
    const searchPn = oemCodes[0] ?? artNo;
    if (!searchPn) return;
    setCollapseDetailSections(true);
    setActionKey("e");
    setActionErr(null);
    try {
      setActionPayload(await api.remusaEquivSearch(searchPn));
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "Error");
    } finally {
      setActionKey(null);
    }
  };

  const specs =
    (merged.allSpecifications as Array<Record<string, unknown>>) ?? [];
  const hasRemusaEffective = Boolean(remusaEntry || articuloResolved);

  const tecdocMenuItems = useMemo((): MenuItem[] => {
    const items: MenuItem[] = [
      {
        id: "t",
        title: "cross-referencias aftermarket",
        subtitle: "lookup TecDoc · specs y equivalentes",
      },
    ];
    if (oemCodes.length > 0) {
      items.push({
        id: "o",
        title: "ver números OEM",
        subtitle: `${oemCodes.length} referencia${oemCodes.length === 1 ? "" : "s"}`,
      });
    }
    if (cars.length > 0) {
      items.push({
        id: "c",
        title: "ver vehículos compatibles",
        subtitle: `${cars.length} registro${cars.length === 1 ? "" : "s"}`,
      });
    }
    if (articuloResolved) {
      items.push({
        id: "r",
        title: "actualizar detalle REMUSA",
        subtitle: "recargar desde inventario",
      });
    }
    if (!remusaEntry && !articuloResolved) {
      items.push({
        id: "e",
        title: "buscar equivalencias en REMUSA",
        subtitle: "cross-ref por número TecDoc / OEM",
      });
    }
    if (oemCodes[0]) {
      items.push({
        id: "2",
        title: "intercambio OEM",
        subtitle: "API 4004 · reemplazos",
      });
    }
    items.push({
      id: "5",
      title: "consultar precio 4S",
      subtitle: "referencia de mercado · API 4006",
    });
    return items;
  }, [oemCodes, cars.length, articuloResolved, remusaEntry]);

  const onMenuSelect = useCallback(
    (item: MenuItem) => {
      if (actionKey != null) return;
      if (item.id === "t") {
        if (!artNo) return;
        void run("t", () =>
          api.tecdocPartLookup(artNo, fallbackStr || undefined),
        );
        return;
      }
      if (item.id === "o") {
        setCollapseDetailSections(true);
        setSubPanel((p) => (p === "oems" ? null : "oems"));
        return;
      }
      if (item.id === "c") {
        setCollapseDetailSections(true);
        setSubPanel((p) => (p === "cars" ? null : "cars"));
        return;
      }
      if (item.id === "r") {
        if (!articuloResolved) return;
        void loadRemusa(articuloResolved);
        return;
      }
      if (item.id === "e") {
        void onEquiv();
        return;
      }
      if (item.id === "2") {
        const o = oemCodes[0];
        if (!o) return;
        void run("2", () => api.partsInterchange(o).then((r) => r.data));
        return;
      }
      if (item.id === "5") {
        const code = oemCodes[0] ?? artNo;
        if (!code) return;
        void run("5", () => api.partsPrice(code).then((r) => r.prices));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [actionKey, artNo, fallbackStr, articuloResolved, oemCodes, loadRemusa],
  );

  if (!open || !listArticle) return null;

  return createPortal(
    <>
      <AnimatePresence>
        <motion.div
          key="td-article-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Detalle artículo TecDoc"
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
                  <span className="font-normal text-white/55">TecDoc · </span>
                  <span className="break-all">
                    {supplier ? `${supplier} ` : ""}
                    {artNo || "—"}
                  </span>
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
              {detailLoading ? (
                <p className="text-[11px] text-neutral-500">
                  Cargando detalle completo…
                </p>
              ) : null}

              {!remusaEntry && !remusaDetail ? (
                <p className="rounded-xl border border-neutral-200/80 bg-white px-3 py-2 text-[11px] text-neutral-500 shadow-sm">
                  No encontrada en REMUSA (directa). Use equivalencias en el
                  menú de acciones.
                </p>
              ) : null}

              {remusaEntry || remusaDetail ? (
                <SheetSection
                  title={`REMUSA${articuloResolved ? ` · ${articuloResolved}` : ""}`}
                  collapseSignal={collapseDetailSections}
                >
                  {remusaLoading ? (
                    <p className="text-[11px] text-neutral-600">Cargando…</p>
                  ) : remusaDetail ? (
                    (() => {
                      const c1 = remusaDetail.clasificacion_1 as
                        | { codigo?: string; descripcion?: string }
                        | undefined;
                      const c2 = remusaDetail.clasificacion_2 as
                        | { codigo?: string; descripcion?: string }
                        | undefined;
                      const inv =
                        (remusaDetail.inventario as Array<
                          Record<string, unknown>
                        >) ?? [];
                      const precios = remusaDetail.precios as
                        | { mayoreo?: number | null; detalle?: number | null }
                        | undefined;
                      return (
                        <>
                          <DetailRow
                            label="Código"
                            value={String(remusaDetail.articulo ?? "")}
                            highlight
                          />
                          <DetailRow
                            label="Descripción"
                            value={String(remusaDetail.descripcion ?? "")}
                          />
                          <DetailRow label="Match via" value={rmPn} />
                          <DetailRow
                            label="Activo"
                            value={
                              remusaDetail.activo === true
                                ? "Sí"
                                : remusaDetail.activo === false
                                  ? "No"
                                  : ""
                            }
                          />
                          {c1?.codigo ? (
                            <DetailRow
                              label="Familia"
                              value={`${c1.codigo} — ${c1.descripcion ?? ""}`.trim()}
                            />
                          ) : null}
                          {c2?.codigo ? (
                            <DetailRow
                              label="Sub-familia"
                              value={`${c2.codigo} — ${c2.descripcion ?? ""}`.trim()}
                            />
                          ) : null}
                          <DetailRow
                            label="Proveedor"
                            value={String(remusaDetail.proveedor ?? "")}
                          />
                          <DetailRow
                            label="Art. del proveedor"
                            value={String(
                              remusaDetail.articulo_del_proveedor ?? "",
                            )}
                          />
                          <DetailRow
                            label="Unidad almacén / venta"
                            value={`${String(remusaDetail.unidad_almacen ?? "")} / ${String(remusaDetail.unidad_venta ?? "")}`}
                          />
                          {precios ? (
                            <div className="mt-2 border-t border-neutral-200 pt-2">
                              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#75141C]/90">
                                Precios
                              </p>
                              {precios.mayoreo != null ? (
                                <DetailRow
                                  label="Mayoreo"
                                  value={moneyCRC(precios.mayoreo)}
                                />
                              ) : null}
                              {precios.detalle != null ? (
                                <DetailRow
                                  label="Detalle"
                                  value={moneyCRC(precios.detalle)}
                                />
                              ) : null}
                            </div>
                          ) : null}
                          <div className="mt-2 border-t border-neutral-200 pt-2">
                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#75141C]/90">
                              Inventario por bodega
                            </p>
                            {inv.length > 0 ? (
                              <ul className="max-h-40 overflow-auto space-y-1 text-[10px] text-neutral-800">
                                {inv.map((row, i) => (
                                  <li
                                    key={i}
                                    className="flex flex-wrap gap-x-2 border-b border-neutral-100/80 pb-1"
                                  >
                                    <span className="font-medium">
                                      {String(row.bodega)}
                                    </span>
                                    <span className="text-neutral-500">
                                      {String(row.nombre)}
                                    </span>
                                    <span>Disp: {String(row.disponible)}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-[10px] text-neutral-400">
                                Sin stock en bodegas
                              </p>
                            )}
                          </div>
                        </>
                      );
                    })()
                  ) : remusaEntry ? (
                    <DetailRow
                      label="Resumen"
                      value={`${remusaEntry.hit.articulo} (${remusaEntry.hit.source})`}
                      highlight
                    />
                  ) : null}
                </SheetSection>
              ) : null}

              <SheetSection
                title="Artículo TecDoc"
                collapseSignal={collapseDetailSections}
              >
                <DetailRow label="Article ID" value={articleId} />
                <DetailRow label="Número" value={artNo} highlight />
                <DetailRow label="Producto" value={product} />
                <DetailRow label="Proveedor" value={supplier} />
                <DetailRow label="Vehículo TecDoc" value={vehicleId} />
                {imgUrl ? (
                  <div className="mt-2 border-t border-neutral-200 pt-3">
                    <img
                      src={imgUrl}
                      alt={artNo}
                      className="max-h-40 w-full rounded-lg border border-neutral-200 bg-white object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setImgOpen(true)}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200/90 bg-white px-4 py-3 text-[13px] font-medium text-neutral-800 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] transition hover:border-neutral-300 hover:shadow-md"
                    >
                      <HiArrowsPointingOut
                        className="h-4 w-4 shrink-0 text-neutral-500"
                        aria-hidden
                      />
                      Ver imagen
                    </button>
                  </div>
                ) : null}
              </SheetSection>

              {specs.length > 0 ? (
                <SheetSection
                  title={`Especificaciones (${specs.length})`}
                  collapseSignal={collapseDetailSections}
                >
                  <div>
                    {specs.map((s, i) => (
                      <DetailRow
                        key={i}
                        label={String(s.criteriaName ?? "")}
                        value={String(s.criteriaValue ?? "")}
                      />
                    ))}
                  </div>
                </SheetSection>
              ) : null}

              {subPanel === "oems" && oemCodes.length > 0 ? (
                <SheetSection
                  title={`OEM equivalentes (${oemCodes.length})`}
                  collapseSignal={false}
                >
                  <ul className="max-h-48 space-y-1.5 overflow-y-auto">
                    {(
                      (merged.oemNo ?? merged.oemNumbers) as Array<
                        Record<string, unknown>
                      >
                    )?.map((o, i) => (
                      <li
                        key={i}
                        className="rounded-xl border border-neutral-200/80 bg-white p-2.5 shadow-sm"
                      >
                        <p className="text-[13px] font-semibold leading-snug text-neutral-900">
                          {String(o.oemBrand ?? o.mfrName ?? "").trim() ||
                            "OEM"}
                        </p>
                        <p className="mt-0.5 text-[11px] font-medium text-[#75141C]">
                          {String(o.oemDisplayNo ?? o.oemNumber ?? "")}
                        </p>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setSubPanel(null)}
                    className="mt-3 w-full rounded-xl border border-[#75141C]/25 bg-[#75141C]/5 px-3 py-2 text-center text-[11px] font-medium text-[#75141C] transition hover:border-[#75141C]/40 hover:bg-[#75141C]/10"
                  >
                    Cerrar lista
                  </button>
                </SheetSection>
              ) : null}

              {subPanel === "cars" && cars.length > 0 ? (
                <SheetSection
                  title={`Vehículos compatibles (${cars.length})`}
                  collapseSignal={false}
                >
                  <div className="space-y-3">
                    <p className="text-[11px] text-neutral-500">
                      {cars.length} vehículo{cars.length === 1 ? "" : "s"}{" "}
                      compatible{cars.length === 1 ? "" : "s"}
                    </p>
                    <ul className="space-y-1.5">
                      {cars.map((car, j) => {
                        const modelName = String(
                          car.modelName ?? car.carName ?? "—",
                        );
                        const mfr = String(car.manufacturerName ?? "").trim();
                        const engine = String(
                          car.typeEngineName ?? car.carName ?? "",
                        ).trim();
                        const start = String(
                          car.constructionIntervalStart ?? "?",
                        ).slice(0, 7);
                        const endRaw = String(
                          car.constructionIntervalEnd ?? "",
                        ).trim();
                        const end = endRaw ? endRaw.slice(0, 7) : "actual";
                        return (
                          <li
                            key={j}
                            className="rounded-xl border border-neutral-200/80 bg-white p-2.5 shadow-sm"
                          >
                            <p className="text-[13px] font-semibold leading-snug text-neutral-900">
                              {modelName}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-neutral-600">
                              {mfr ? <span>{mfr}</span> : null}
                              {engine ? <span>{engine}</span> : null}
                              <span className="text-neutral-500">
                                {start} → {end}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubPanel(null)}
                    className="mt-3 w-full rounded-xl border border-[#75141C]/25 bg-[#75141C]/5 px-3 py-2 text-center text-[11px] font-medium text-[#75141C] transition hover:border-[#75141C]/40 hover:bg-[#75141C]/10"
                  >
                    Cerrar lista
                  </button>
                </SheetSection>
              ) : null}

              <div className="overflow-hidden rounded-[24px] bg-linear-to-b from-[#8f2330] to-[#75141C] shadow-[0_12px_32px_-16px_rgba(0,0,0,0.4)]">
                <div className="flex shrink-0 items-start justify-between gap-2 border-b border-white/15 px-3 py-2">
                  <p className="pt-0.5 text-[10px] font-medium uppercase tracking-widest text-white/45">
                    {"> detalle artículo · acciones"}
                  </p>
                </div>
                <div className="p-3 pt-2">
                  <ul className="flex flex-col gap-1">
                    {tecdocMenuItems.map((item) => (
                      <li key={item.id}>
                        <MenuTerminalRow
                          item={item}
                          onSelect={onMenuSelect}
                          variant="dark"
                          disabled={
                            actionKey != null ||
                            (item.id === "t" && !artNo) ||
                            (item.id === "2" && !oemCodes[0]) ||
                            (item.id === "5" && !(oemCodes[0] ?? artNo)) ||
                            (item.id === "e" &&
                              !artNo &&
                              oemCodes.length === 0) ||
                            (item.id === "r" && !articuloResolved)
                          }
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

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
                  <div className="mt-2 overflow-hidden rounded-xl border border-neutral-200/80 bg-neutral-950 p-3">
                    <pre className="wrap-break-word max-h-[min(40vh,360px)] overflow-auto text-[10px] leading-relaxed text-emerald-100/95 whitespace-pre-wrap">
                      {JSON.stringify(actionPayload, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
      {imgUrl ? (
        <DiagramLightbox
          open={imgOpen}
          onClose={() => setImgOpen(false)}
          src={imgUrl}
          alt={artNo}
        />
      ) : null}
    </>,
    document.body,
  );
}
