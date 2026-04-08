import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCatalogDockContext } from "../../contexts/CatalogDockContext";
import { HiArrowsPointingOut } from "react-icons/hi2";
import type { CatalogSession } from "../../types";
import type { MenuItem } from "../../constants/remusaMenu";
import { EPC_LOADING_MESSAGES, type EpcLoadingKey } from "../../constants/catalogLoadingMessages";
import EpcCatalogFloatingDock from "./EpcCatalogFloatingDock";
import TerminalLoader from "../search/TerminalLoader";
import * as api from "../../lib/remusaApi";
import type { RemusaBatchHit } from "../../lib/remusaApi";
import DiagramLightbox from "./DiagramLightbox";
import { PartMedia } from "./PartMedia";
import EpcOemPartDetailSheet from "./EpcOemPartDetailSheet";

const OE_PAGE = 120;

function isLeaf(c: Record<string, unknown>): boolean {
  return Number(c.is_last) === 1 || c.is_last === true;
}

export default function EpcCatalogHub({
  session,
  onBack,
}: {
  session: CatalogSession;
  onBack: () => void;
}) {
  const { epc, vin, epcId, decodeRaw } = session;
  const epcIdParam = epcId || undefined;

  const [panel, setPanel] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loadingKey, setLoadingKey] = useState<EpcLoadingKey | null>(null);

  const [catPath, setCatPath] = useState<Array<{ level: number; cata_code: string; name: string }>>([]);
  const [levelCats, setLevelCats] = useState<Array<Record<string, unknown>>>([]);
  const [partsPayload, setPartsPayload] = useState<Record<string, unknown> | null>(null);

  const [oemQuery, setOemQuery] = useState("");
  const [oemHits, setOemHits] = useState<Array<Record<string, unknown>>>([]);

  const [allOe, setAllOe] = useState<string[]>([]);
  const [oePage, setOePage] = useState(0);

  const [standaloneQ, setStandaloneQ] = useState("");
  const [standaloneHits, setStandaloneHits] = useState<Array<Record<string, unknown>>>([]);

  const [pricePn, setPricePn] = useState("");
  const [priceData, setPriceData] = useState<unknown>(null);

  const [remusaSummary, setRemusaSummary] = useState<Record<string, unknown> | null>(null);
  const [diagramLightboxOpen, setDiagramLightboxOpen] = useState(false);
  const [categoryLightbox, setCategoryLightbox] = useState<{ src: string; alt: string } | null>(null);

  const [remusaByPn, setRemusaByPn] = useState<Record<string, RemusaBatchHit>>({});
  const [remusaBatchLoading, setRemusaBatchLoading] = useState(false);
  const [oemSheetOpen, setOemSheetOpen] = useState(false);
  const [oemSheetPart, setOemSheetPart] = useState<Record<string, unknown> | null>(null);
  const [oemSheetRemusa, setOemSheetRemusa] = useState<RemusaBatchHit | null>(null);

  /** Last successful search inputs — skip repeat API + loader when unchanged. */
  const lastOemSearchRef = useRef<string | null>(null);
  const lastStandaloneSearchRef = useRef<string | null>(null);
  const lastPricePnRef = useRef<string | null>(null);

  const loadCategories = useCallback(
    async (level: number, parent_code?: string) => {
      setLoadingKey("categories");
      setErr(null);
      try {
        const r = await api.epcCategories({
          epc,
          vin,
          level,
          parent_code: parent_code ?? undefined,
          epc_id: epcIdParam,
        });
        setLevelCats(r.categories ?? []);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Error categorías");
        setLevelCats([]);
      } finally {
        setLoadingKey(null);
      }
    },
    [epc, vin, epcIdParam],
  );

  const loadParts = useCallback(
    async (cata_code: string, level: number) => {
      setLoadingKey("parts");
      setErr(null);
      try {
        const r = await api.epcParts({
          epc,
          vin,
          cata_code,
          level,
          epc_id: epcIdParam,
        });
        setPartsPayload(r);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Error partes");
        setPartsPayload(null);
      } finally {
        setLoadingKey(null);
      }
    },
    [epc, vin, epcIdParam],
  );

  const onMenuSelect = (item: MenuItem) => {
    setErr(null);
    if (item.id === "b") {
      onBack();
      return;
    }
    setPanel(item.id);
    if (item.id === "1") {
      setCatPath([]);
      setPartsPayload(null);
      void loadCategories(1);
    }
    if (item.id === "3") {
      if (allOe.length > 0) {
        setOePage(0);
        return;
      }
      setLoadingKey("allOe");
      api
        .epcAllOe(epc, vin)
        .then((r) => {
          setAllOe(r.parts ?? []);
          setOePage(0);
        })
        .catch((e) => setErr(e instanceof Error ? e.message : "Error OE"))
        .finally(() => setLoadingKey(null));
    }
    if (item.id === "7") {
      if (remusaSummary != null) return;
      setLoadingKey("remusa");
      api
        .remusaMatchVehicleOe(epc, vin)
        .then((r) => setRemusaSummary(r))
        .catch((e) => setErr(e instanceof Error ? e.message : "Error REMUSA"))
        .finally(() => setLoadingKey(null));
    }
  };

  const onPickCategory = (c: Record<string, unknown>) => {
    const code = String(c.cata_code ?? c.cataCode ?? "");
    const name = String(c.name_en ?? c.name_zh ?? code);
    const level = catPath.length + 1;
    if (!code) return;
    if (isLeaf(c)) {
      void loadParts(code, level);
      setCatPath((p) => [...p, { level, cata_code: code, name }]);
    } else {
      setPartsPayload(null);
      setCatPath((p) => [...p, { level, cata_code: code, name }]);
      void loadCategories(level + 1, code);
    }
  };

  const goBackCategory = () => {
    setPartsPayload(null);
    setCatPath((p) => {
      const next = p.slice(0, -1);
      if (next.length === 0) {
        void loadCategories(1);
      } else {
        const parent = next[next.length - 1];
        void loadCategories(next.length + 1, parent.cata_code);
      }
      return next;
    });
  };

  const dataBlock = partsPayload?.data as Record<string, unknown> | undefined;
  const partlist = (dataBlock?.partlist as Array<Record<string, unknown>>) ?? [];
  const imgAddress = dataBlock ? String(dataBlock.imgaddress ?? dataBlock.imgAddress ?? "") : "";
  const diagram = api.diagramUrl(epc, imgAddress || undefined);

  const basePartlist = useMemo(() => {
    const d = partsPayload?.data as Record<string, unknown> | undefined;
    const pl = (d?.partlist as Array<Record<string, unknown>>) ?? [];
    const fit = pl.filter((p) => Number(p.is_fit_for_this_vin) === 1);
    return fit.length ? fit : pl;
  }, [partsPayload]);

  const partlistBatchKey = useMemo(
    () => basePartlist.map((p) => String(p.partnumber ?? p.Partnumber ?? "")).join("\0"),
    [basePartlist],
  );

  useEffect(() => {
    if (basePartlist.length === 0) {
      setRemusaByPn({});
      setRemusaBatchLoading(false);
      return;
    }
    const pns = basePartlist
      .map((p) => String(p.partnumber ?? p.Partnumber ?? "").trim())
      .filter(Boolean);
    if (pns.length === 0) {
      setRemusaByPn({});
      return;
    }
    let cancelled = false;
    setRemusaBatchLoading(true);
    void api
      .remusaBatchCheck(pns)
      .then((r) => {
        if (!cancelled) setRemusaByPn((r.results as Record<string, RemusaBatchHit>) ?? {});
      })
      .catch(() => {
        if (!cancelled) setRemusaByPn({});
      })
      .finally(() => {
        if (!cancelled) setRemusaBatchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [partlistBatchKey, basePartlist.length]);

  const sortedPartlist = useMemo(() => {
    const withI = basePartlist.map((p, i) => ({ p, i }));
    withI.sort((a, b) => {
      const pa = String(a.p.partnumber ?? a.p.Partnumber ?? "");
      const pb = String(b.p.partnumber ?? b.p.Partnumber ?? "");
      const ma = remusaByPn[pa] ? 1 : 0;
      const mb = remusaByPn[pb] ? 1 : 0;
      if (ma !== mb) return mb - ma;
      return a.i - b.i;
    });
    return withI.map((x) => x.p);
  }, [basePartlist, remusaByPn]);

  const remusaMatchCount = useMemo(
    () =>
      basePartlist.filter((p) => {
        const k = String(p.partnumber ?? p.Partnumber ?? "");
        return Boolean(remusaByPn[k]);
      }).length,
    [basePartlist, remusaByPn],
  );

  useEffect(() => {
    if (!diagram) setDiagramLightboxOpen(false);
  }, [diagram]);

  const dockCtx = useCatalogDockContext();
  const scrollCatalogNavIntoView = dockCtx?.scrollCatalogNavIntoView;
  const setNavAnchorRef = useCallback((el: HTMLDivElement | null) => {
    dockCtx?.registerCatalogNavAnchor(el);
  }, [dockCtx]);
  const prevLoadingKeyRef = useRef<EpcLoadingKey | null>(null);
  useEffect(() => {
    if (prevLoadingKeyRef.current != null && loadingKey == null) {
      scrollCatalogNavIntoView?.();
    }
    prevLoadingKeyRef.current = loadingKey;
  }, [loadingKey, scrollCatalogNavIntoView]);

  const oeSlice = allOe.slice(oePage * OE_PAGE, (oePage + 1) * OE_PAGE);

  /** Category tree / parts fetch: hide nav UI and show only the terminal loader. */
  const epcCategoryNavLoading =
    panel === "1" &&
    loadingKey != null &&
    (loadingKey === "categories" || loadingKey === "parts");

  const factoryBlocks = (decodeRaw?.model_original_epc_list as Array<Record<string, unknown>>) ?? [];

  return (
    <>
      <EpcCatalogFloatingDock onSelect={onMenuSelect} activePanelId={panel} />
      <div className="flex flex-col gap-3">
      {loadingKey && panel && !epcCategoryNavLoading && (
        <TerminalLoader
          messages={[...EPC_LOADING_MESSAGES[loadingKey]]}
          active
          variant="light"
        />
      )}
      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 font-mono text-xs text-red-800">
          {err}
        </div>
      )}

      {panel === "1" && (
        <>
        <div ref={setNavAnchorRef} className="flex min-w-0 flex-col gap-3">
        {epcCategoryNavLoading && loadingKey ? (
          <TerminalLoader
            messages={[...EPC_LOADING_MESSAGES[loadingKey]]}
            active
            variant="light"
          />
        ) : (
        <>
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            Navegación categorías
          </p>
          {catPath.length > 0 && (
            <button
              type="button"
              onClick={goBackCategory}
              className="mt-3 min-h-[40px] w-full rounded-xl border border-neutral-200/80 bg-white px-3 py-2 text-left text-sm font-medium text-neutral-800 shadow-sm transition hover:border-neutral-300/90 hover:bg-neutral-50/90 sm:w-auto"
            >
              ← Volver nivel
            </button>
          )}
          <p className="mt-2 text-xs leading-relaxed text-neutral-500">
            {catPath.map((x) => x.name).join(" → ") || "Nivel 1"}
          </p>
          {partlist.length === 0 && diagram && (
            <div className="relative mt-3">
              <PartMedia src={diagram} alt="Diagrama EPC" className="max-h-56 w-full object-contain" />
              <button
                type="button"
                onClick={() => setDiagramLightboxOpen(true)}
                className="absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-lg border border-neutral-200/90 bg-white/95 px-2.5 py-1.5 font-mono text-[11px] font-medium text-neutral-800 shadow-sm backdrop-blur-sm transition hover:bg-white"
                aria-label="Ver diagrama ampliado"
              >
                <HiArrowsPointingOut className="h-4 w-4 shrink-0" aria-hidden />
                Ver
              </button>
            </div>
          )}
          {partlist.length === 0 && (
          <ul className="mt-2 space-y-1.5">
            {levelCats.map((c, idx) => {
              const cataCode = String(c.cata_code ?? c.cataCode ?? idx);
              const imgAddr = String(
                c.illustration_img_address ?? c.Illustration_img_address ?? "",
              ).trim();
              const catThumb = api.diagramUrl(epc, imgAddr || undefined);
              const nameLineRaw = String(c.name_en ?? c.name_zh ?? "").trim();
              const categoryTitle = nameLineRaw || cataCode;
              const lightboxAlt = [cataCode, nameLineRaw].filter(Boolean).join(" · ");
              return (
                <li key={`${cataCode}-${idx}`}>
                  <div className="flex items-center gap-2 rounded-lg border border-neutral-200/80 bg-white p-2 shadow-sm transition-[box-shadow,border-color] hover:border-neutral-300/90 hover:shadow">
                    {catThumb ? (
                      <button
                        type="button"
                        onClick={() =>
                          setCategoryLightbox({
                            src: catThumb,
                            alt: lightboxAlt || "Categoría",
                          })
                        }
                        className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md border border-neutral-200/80 bg-neutral-100 text-left transition hover:brightness-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#75141C]/35 focus-visible:ring-offset-1"
                        aria-label={`Ampliar ilustración: ${lightboxAlt}`}
                      >
                        <img
                          src={catThumb}
                          alt=""
                          className="pointer-events-none h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </button>
                    ) : (
                      <div
                        className="h-11 w-11 shrink-0 rounded-md border border-neutral-200/80 bg-neutral-100/90"
                        aria-hidden
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => onPickCategory(c)}
                      className="min-w-0 flex-1 py-0.5 text-left"
                    >
                      <span className="line-clamp-2 text-[13px] font-medium leading-snug text-neutral-800">
                        {categoryTitle}
                        {isLeaf(c) ? (
                          <span className="ml-1.5 text-[10px] font-normal uppercase tracking-wide text-neutral-400">
                            · Partes
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          )}
          {partlist.length > 0 && (
            <div className="mt-3 space-y-3 border-t border-neutral-100 pt-3">
              {diagram && (
                <div className="relative">
                  <PartMedia src={diagram} alt="Diagrama" className="max-h-48 w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setDiagramLightboxOpen(true)}
                    className="absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-lg border border-neutral-200/90 bg-white/95 px-2.5 py-1.5 font-mono text-[11px] font-medium text-neutral-800 shadow-sm backdrop-blur-sm transition hover:bg-white"
                    aria-label="Ver diagrama ampliado"
                  >
                    <HiArrowsPointingOut className="h-4 w-4 shrink-0" aria-hidden />
                    Ver
                  </button>
                </div>
              )}
              {remusaBatchLoading ? (
                <p className="font-mono text-[11px] text-neutral-500">Cruce con REMUSA…</p>
              ) : remusaMatchCount > 0 ? (
                <p className="font-mono text-[11px] font-medium text-[#75141C]">
                  {remusaMatchCount} pieza{remusaMatchCount === 1 ? "" : "s"} en REMUSA
                </p>
              ) : (
                <p className="font-mono text-[11px] text-neutral-500">
                  Ninguna parte de esta categoría está en REMUSA.
                </p>
              )}
              <div className="space-y-3">
                {sortedPartlist.map((p, i) => {
                  const pn = String(p.partnumber ?? p.Partnumber ?? i);
                  const name = String(p.name_en ?? p.Name_en ?? "");
                  const hit = remusaByPn[pn];
                  const codeLineClass =
                    "font-mono text-[12px] font-semibold leading-snug text-neutral-900";
                  return (
                    <div
                      key={`${pn}-${i}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setOemSheetPart(p);
                        setOemSheetRemusa(hit ?? null);
                        setOemSheetOpen(true);
                      }}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter" || ev.key === " ") {
                          ev.preventDefault();
                          setOemSheetPart(p);
                          setOemSheetRemusa(hit ?? null);
                          setOemSheetOpen(true);
                        }
                      }}
                      className={`cursor-pointer rounded-xl border border-neutral-200/80 bg-white p-3 shadow-sm transition-[box-shadow,border-color] hover:border-neutral-300/90 hover:shadow-md ${
                        hit ? "ring-1 ring-[#75141C]/12" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <p className={codeLineClass}>
                          {hit ? <span className="text-[#75141C]">★ </span> : null}
                          {pn}
                        </p>
                        {hit?.desc ? <p className={`${codeLineClass} mt-0.5`}>{hit.desc}</p> : null}
                        {name ? (
                          <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">{name}</p>
                        ) : null}
                        {hit ? (
                          <div className="mt-2.5 border-t border-neutral-100 pt-2.5">
                            <p className="font-mono text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                              Código REMUSA
                            </p>
                            <p className="mt-0.5 font-mono text-[11px] font-semibold text-[#75141C]">
                              {hit.articulo}
                              <span className="font-normal text-neutral-500">
                                {" "}
                                · {hit.source}
                              </span>
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {diagram ? (
          <DiagramLightbox
            open={diagramLightboxOpen}
            onClose={() => setDiagramLightboxOpen(false)}
            src={diagram}
            alt="Diagrama EPC"
          />
        ) : null}
        {categoryLightbox ? (
          <DiagramLightbox
            open
            onClose={() => setCategoryLightbox(null)}
            src={categoryLightbox.src}
            alt={categoryLightbox.alt}
          />
        ) : null}
        </>
        )}
        </div>
        </>
      )}

      {panel === "2" && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
            {" > buscar OEM en vehículo"}
          </p>
          <input
            value={oemQuery}
            onChange={(e) => setOemQuery(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 font-mono text-sm"
            placeholder="Número OEM"
          />
          <button
            type="button"
            onClick={async () => {
              const q = oemQuery.trim();
              if (!q) return;
              if (oemHits.length > 0 && lastOemSearchRef.current === q) return;
              setLoadingKey("oemSearch");
              setErr(null);
              try {
                const r = await api.epcSearchPart({
                  epc,
                  vin,
                  part_number: q,
                  epc_id: epcIdParam,
                });
                const d = r.data as Record<string, unknown> | undefined;
                const list = (d?.searchlist as Array<Record<string, unknown>>) ?? [];
                setOemHits(list);
                lastOemSearchRef.current = q;
              } catch (e) {
                setErr(e instanceof Error ? e.message : "Sin resultados");
                setOemHits([]);
              } finally {
                setLoadingKey(null);
              }
            }}
            className="min-h-[44px] w-full rounded-xl bg-[#75141C] px-3 py-2 font-mono text-sm text-white"
          >
            Buscar
          </button>
          <ul className="flex flex-col gap-2">
            {oemHits.map((h, i) => {
              const pn = String(h.partnumber ?? h.Partnumber ?? i);
              const imgRaw = h.illustration_img_address ?? h.Part_img;
              const thumb = api.imageUrlFromPart(epc, imgRaw != null ? String(imgRaw) : undefined);
              return (
                <li
                  key={pn}
                  className="flex gap-3 rounded-xl border border-neutral-200/80 bg-[#f4f4f7] p-2.5"
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={pn}
                      className="h-14 w-14 shrink-0 rounded-lg border border-neutral-200/80 bg-white object-cover"
                    />
                  ) : (
                    <div
                      className="h-14 w-14 shrink-0 rounded-lg border border-dashed border-neutral-200 bg-neutral-100/80"
                      aria-hidden
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[12px] font-semibold text-neutral-900">{pn}</p>
                    <p className="text-[11px] text-neutral-600">{String(h.name_en ?? "")}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {panel === "3" && allOe.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
          <p className="mb-2 font-mono text-[10px] text-neutral-500">
            {` > ${allOe.length} números OE · página ${oePage + 1}`}
          </p>
          <ul className="flex flex-col gap-1.5 font-mono text-[11px] text-neutral-800">
            {oeSlice.map((pn) => (
              <li
                key={pn}
                className="rounded-xl border border-neutral-200/80 bg-[#f4f4f7] px-3 py-2.5"
              >
                {pn}
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={oePage === 0}
              onClick={() => setOePage((p) => Math.max(0, p - 1))}
              className="rounded-lg border px-3 py-2 font-mono text-xs disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={(oePage + 1) * OE_PAGE >= allOe.length}
              onClick={() => setOePage((p) => p + 1)}
              className="rounded-lg border px-3 py-2 font-mono text-xs disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {panel === "4" && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-neutral-400">
            {" > opciones de fábrica"}
          </p>
          {factoryBlocks.length === 0 ? (
            <p className="text-sm text-neutral-500">Sin datos de opciones en esta decodificación.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {factoryBlocks.map((block, bi) => {
                const attrs = (block.CarAttributes as Array<Record<string, unknown>>) ?? [];
                const en = attrs.filter((a) => String(a.Language) === "en");
                const use = en.length ? en : attrs.filter((a) => String(a.Language) === "zh");
                const rows = use.length ? use : attrs;
                return (
                  <li
                    key={bi}
                    className="rounded-xl border border-neutral-200/80 bg-[#f4f4f7] px-3 py-2.5"
                  >
                    {rows.map((a, j) => (
                      <p key={j} className="font-mono text-[11px] text-neutral-800">
                        <span className="text-neutral-500">{String(a.Col_name ?? "")}: </span>
                        {String(a.Col_value ?? "")}
                      </p>
                    ))}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {panel === "5" && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
            {" > búsqueda global de parte"}
          </p>
          <input
            value={standaloneQ}
            onChange={(e) => setStandaloneQ(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 font-mono text-sm"
            placeholder="OEM o aftermarket"
          />
          <button
            type="button"
            onClick={async () => {
              const q = standaloneQ.trim();
              if (!q) return;
              if (standaloneHits.length > 0 && lastStandaloneSearchRef.current === q) return;
              setLoadingKey("standalone");
              setErr(null);
              try {
                const r =
                  q.length >= 3
                    ? await api.partsSearchFuzzy(q)
                    : await api.partsSearchExact(q);
                setStandaloneHits(r.results ?? []);
                lastStandaloneSearchRef.current = q;
              } catch (e) {
                setErr(e instanceof Error ? e.message : "Sin resultados");
                setStandaloneHits([]);
              } finally {
                setLoadingKey(null);
              }
            }}
            className="min-h-[44px] w-full rounded-xl bg-[#75141C] px-3 py-2 font-mono text-sm text-white"
          >
            Buscar
          </button>
          <ul className="flex flex-col gap-2">
            {standaloneHits.map((p, i) => {
              const pr = api.mapPartRowToPartResult(p, String(i));
              return (
                <li
                  key={pr.partNumber + i}
                  className="flex gap-3 rounded-xl border border-neutral-200/80 bg-[#f4f4f7] p-2.5"
                >
                  {pr.partImg ? (
                    <img
                      src={pr.partImg}
                      alt={pr.partNumber}
                      className="h-14 w-14 shrink-0 rounded-lg border border-neutral-200/80 bg-white object-cover"
                    />
                  ) : (
                    <div
                      className="h-14 w-14 shrink-0 rounded-lg border border-dashed border-neutral-200 bg-neutral-100/80"
                      aria-hidden
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[12px] font-semibold text-neutral-900">{pr.partNumber}</p>
                    <p className="text-[11px] text-neutral-600">{pr.partNameEn}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {panel === "6" && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
            {" > precio 4S (mercado referencia)"}
          </p>
          <input
            value={pricePn}
            onChange={(e) => setPricePn(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 font-mono text-sm"
            placeholder="Número OEM"
          />
          <button
            type="button"
            onClick={async () => {
              const pn = pricePn.trim();
              if (!pn) return;
              if (priceData != null && lastPricePnRef.current === pn) return;
              setLoadingKey("price");
              setErr(null);
              try {
                const r = await api.partsPrice(pn);
                setPriceData(r.prices);
                lastPricePnRef.current = pn;
              } catch (e) {
                setErr(e instanceof Error ? e.message : "Sin precio");
                setPriceData(null);
              } finally {
                setLoadingKey(null);
              }
            }}
            className="min-h-[44px] w-full rounded-xl bg-[#75141C] px-3 py-2 font-mono text-sm text-white"
          >
            Consultar
          </button>
          {priceData != null && (
            <pre className="wrap-break-word overflow-x-auto rounded-lg bg-neutral-900 p-3 font-mono text-[10px] leading-relaxed text-emerald-100 whitespace-pre-wrap">
              {JSON.stringify(priceData, null, 2)}
            </pre>
          )}
        </div>
      )}

      {panel === "7" && remusaSummary && (
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            Coincidencias REMUSA
          </p>
          <p className="mt-2 font-mono text-[11px] font-medium text-[#75141C]">
            {`${String(remusaSummary.matched ?? "")} / ${String(remusaSummary.total_oe ?? "")} · ${String(remusaSummary.percentage ?? "")}%`}
          </p>
          <div className="mt-3 space-y-3 border-t border-neutral-100 pt-3">
            {((remusaSummary.matches as Array<Record<string, unknown>>) ?? []).map((m, i) => {
              const oe = String(m.oe_number ?? "").trim();
              const rem = String(m.articulo ?? m.codigo ?? "").trim();
              const desc = String(m.desc ?? "");
              const source = String(m.source ?? "OE");
              const nameEn = String(
                m.name_en ?? m.Name_en ?? m.Part_name_en ?? m.part_name_en ?? "",
              ).trim();
              const nameZh = String(
                m.name_zh ?? m.Name_zh ?? m.Part_name_zh ?? m.part_name_zh ?? "",
              ).trim();
              const hit: RemusaBatchHit | null = rem
                ? { articulo: rem, desc, source }
                : null;
              const partRow: Record<string, unknown> = {
                partnumber: oe,
                Partnumber: oe,
                oe_number: oe,
              };
              if (nameEn) {
                partRow.name_en = nameEn;
                partRow.Name_en = nameEn;
              }
              if (nameZh) {
                partRow.name_zh = nameZh;
                partRow.Name_zh = nameZh;
              }
              const codeLineClass =
                "font-mono text-[12px] font-semibold leading-snug text-neutral-900";
              const openSheet = () => {
                setOemSheetPart(partRow);
                setOemSheetRemusa(hit);
                setOemSheetOpen(true);
              };
              return (
                <div
                  key={`${oe}-${i}`}
                  role="button"
                  tabIndex={0}
                  onClick={openSheet}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      ev.preventDefault();
                      openSheet();
                    }
                  }}
                  className="cursor-pointer rounded-xl border border-neutral-200/80 bg-white p-3 shadow-sm transition-[box-shadow,border-color] hover:border-neutral-300/90 hover:shadow-md ring-1 ring-[#75141C]/12"
                >
                  <div className="min-w-0">
                    <p className={codeLineClass}>
                      <span className="text-[#75141C]">★ </span>
                      {oe || "—"}
                    </p>
                    {desc ? <p className={`${codeLineClass} mt-0.5`}>{desc}</p> : null}
                    {nameEn ? (
                      <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">{nameEn}</p>
                    ) : null}
                    {hit ? (
                      <div className="mt-2.5 border-t border-neutral-100 pt-2.5">
                        <p className="font-mono text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                          Código REMUSA
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] font-semibold text-[#75141C]">
                          {hit.articulo}
                          <span className="font-normal text-neutral-500"> · {hit.source}</span>
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
    <EpcOemPartDetailSheet
      open={oemSheetOpen}
      onClose={() => {
        setOemSheetOpen(false);
        setOemSheetPart(null);
        setOemSheetRemusa(null);
      }}
      epc={epc}
      part={oemSheetPart}
      remusaHit={oemSheetRemusa}
    />
    </>
  );
}
