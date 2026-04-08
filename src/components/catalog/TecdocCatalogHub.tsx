import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCatalogDockContext } from "../../contexts/CatalogDockContext";
import { HiArrowsPointingOut } from "react-icons/hi2";
import type { CatalogSession } from "../../types";
import type { MenuItem } from "../../constants/remusaMenu";
import {
  TECDOC_LOADING_MESSAGES,
  type TecdocLoadingKey,
} from "../../constants/catalogLoadingMessages";
import TecdocCatalogFloatingDock from "./TecdocCatalogFloatingDock";
import TerminalLoader from "../search/TerminalLoader";
import * as api from "../../lib/remusaApi";
import {
  getTecdocCategoryLevel,
  parseTecdocCategoryMap,
  tecdocCategoryHasChildren,
  type TecdocCatNode,
} from "../../lib/tecdocCategoryTree";
import {
  buildTecdocArticlesRemusaMap,
  type TecdocArticleRemusaEntry,
} from "../../lib/tecdocArticlesRemusa";
import TecdocArticleDetailSheet from "./TecdocArticleDetailSheet";
import DiagramLightbox from "./DiagramLightbox";

const HUB_CARD_SHELL =
  "rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]";

const HUB_INPUT =
  "w-full rounded-xl border border-neutral-200 px-3 py-2 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#75141C]/25";

const HUB_PRIMARY_BTN =
  "min-h-[44px] w-full rounded-xl bg-[#75141C] px-3 py-2 font-mono text-sm text-white transition hover:brightness-110 active:scale-[0.99]";

function partLookupArticleList(res: Record<string, unknown> | null): Array<Record<string, unknown>> {
  if (!res) return [];
  const a = res.articles;
  return Array.isArray(a) ? (a as Array<Record<string, unknown>>) : [];
}

function articleThumb(a: Record<string, unknown>): string | undefined {
  const u =
    a.s3image ??
    a.imageLink ??
    a.imageUrl ??
    a.imgUrl ??
    a.thumbnailUrl ??
    a.articleImage ??
    a.mediaUrl;
  return u ? String(u) : undefined;
}

export default function TecdocCatalogHub({
  session,
  onBack,
}: {
  session: CatalogSession;
  onBack: () => void;
}) {
  const vid = session.tecdocVehicleId ?? "";
  const [panel, setPanel] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loadingKey, setLoadingKey] = useState<TecdocLoadingKey | null>(null);

  const [categoryRoots, setCategoryRoots] = useState<TecdocCatNode[]>([]);
  const [catStack, setCatStack] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedLeafId, setSelectedLeafId] = useState<string | null>(null);
  const [articles, setArticles] = useState<Array<Record<string, unknown>>>([]);

  const [remusaArticleMap, setRemusaArticleMap] = useState<
    Record<string, TecdocArticleRemusaEntry>
  >({});
  const [remusaBatchLoading, setRemusaBatchLoading] = useState(false);

  const [oemQ, setOemQ] = useState("");
  const [oemRes, setOemRes] = useState<Record<string, unknown> | null>(null);

  const [aftQ, setAftQ] = useState("");
  const [aftRes, setAftRes] = useState<Record<string, unknown> | null>(null);

  const [pricePn, setPricePn] = useState("");
  const [priceData, setPriceData] = useState<unknown>(null);

  const [rmPn, setRmPn] = useState("");
  const [rmRes, setRmRes] = useState<Record<string, unknown> | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetArticle, setSheetArticle] = useState<Record<string, unknown> | null>(null);
  const [sheetRemusa, setSheetRemusa] = useState<TecdocArticleRemusaEntry | null>(null);

  const [imgLightbox, setImgLightbox] = useState<{ src: string; alt: string } | null>(null);

  const [lookupRemusaMap, setLookupRemusaMap] = useState<Record<string, TecdocArticleRemusaEntry>>(
    {},
  );

  const lastOemQRef = useRef<string | null>(null);
  const lastAftQRef = useRef<string | null>(null);
  const lastPricePnRef = useRef<string | null>(null);
  const lastRmPnRef = useRef<string | null>(null);

  const currentCategories = useMemo(
    () => getTecdocCategoryLevel(categoryRoots, catStack),
    [categoryRoots, catStack],
  );

  const onMenuSelect = (item: MenuItem) => {
    setErr(null);
    if (item.id === "b") {
      onBack();
      return;
    }
    setPanel(item.id);
    if (item.id === "1" && vid) {
      if (categoryRoots.length > 0) return;
      setLoadingKey("categories");
      api
        .tecdocCategories(vid)
        .then((r) => {
          const raw = r.categories;
          setCategoryRoots(parseTecdocCategoryMap(raw));
        })
        .catch((e) => setErr(e instanceof Error ? e.message : "Error"))
        .finally(() => setLoadingKey(null));
    }
  };

  const onMenuSelectContinue = async (item: MenuItem) => {
    setPanel(item.id);
    if (item.id === "2" && oemQ.trim()) {
      const q = oemQ.trim();
      if (oemRes != null && lastOemQRef.current === q) return;
      setLoadingKey("oem");
      try {
        const r = await api.tecdocPartLookup(q);
        setOemRes(r);
        lastOemQRef.current = q;
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Sin resultados");
        setOemRes(null);
      } finally {
        setLoadingKey(null);
      }
    }
    if (item.id === "3" && aftQ.trim()) {
      const q = aftQ.trim();
      if (aftRes != null && lastAftQRef.current === q) return;
      setLoadingKey("aft");
      try {
        const r = await api.tecdocPartLookup(q);
        setAftRes(r);
        lastAftQRef.current = q;
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Sin resultados");
        setAftRes(null);
      } finally {
        setLoadingKey(null);
      }
    }
    if (item.id === "4" && pricePn.trim()) {
      const pn = pricePn.trim();
      if (priceData != null && lastPricePnRef.current === pn) return;
      setLoadingKey("price");
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
    }
    if (item.id === "5" && rmPn.trim()) {
      const pn = rmPn.trim();
      if (rmRes != null && lastRmPnRef.current === pn) return;
      setLoadingKey("remusa");
      try {
        const r = await api.remusaLookup(pn);
        setRmRes(r);
        lastRmPnRef.current = pn;
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Sin stock");
        setRmRes(null);
      } finally {
        setLoadingKey(null);
      }
    }
  };

  const loadArticles = async (categoryId: string) => {
    if (!vid) return;
    if (selectedLeafId === categoryId && articles.length > 0) return;
    setLoadingKey("articles");
    setErr(null);
    try {
      const r = await api.tecdocArticles(vid, categoryId);
      setArticles(r.articles ?? []);
      setSelectedLeafId(categoryId);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error artículos");
      setArticles([]);
    } finally {
      setLoadingKey(null);
    }
  };

  const articlesKey = useMemo(
    () => articles.map((a) => String(a.articleId ?? "")).join("\0"),
    [articles],
  );

  useEffect(() => {
    if (articles.length === 0) {
      setRemusaArticleMap({});
      return;
    }
    let cancelled = false;
    setRemusaBatchLoading(true);
    void buildTecdocArticlesRemusaMap(articles)
      .then((m) => {
        if (!cancelled) setRemusaArticleMap(m);
      })
      .catch(() => {
        if (!cancelled) setRemusaArticleMap({});
      })
      .finally(() => {
        if (!cancelled) setRemusaBatchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [articlesKey, articles.length]);

  const sortedArticles = useMemo(() => {
    const withI = articles.map((a, i) => ({ a, i }));
    const aid = (x: Record<string, unknown>) => String(x.articleId ?? "");
    withI.sort((x, y) => {
      const mx = remusaArticleMap[aid(x.a)] ? 1 : 0;
      const my = remusaArticleMap[aid(y.a)] ? 1 : 0;
      if (mx !== my) return my - mx;
      return x.i - y.i;
    });
    return withI.map((x) => x.a);
  }, [articles, remusaArticleMap]);

  const matchCount = useMemo(
    () => articles.filter((a) => remusaArticleMap[String(a.articleId ?? "")]).length,
    [articles, remusaArticleMap],
  );

  const lookupArticlesOem = partLookupArticleList(oemRes);
  const lookupArticlesAft = partLookupArticleList(aftRes);
  const lookupKey =
    panel === "2"
      ? `oem-${lookupArticlesOem.map((a) => a.articleId).join("|")}`
      : panel === "3"
        ? `aft-${lookupArticlesAft.map((a) => a.articleId).join("|")}`
        : "";

  useEffect(() => {
    const list =
      panel === "2" ? lookupArticlesOem : panel === "3" ? lookupArticlesAft : [];
    if (list.length === 0) {
      setLookupRemusaMap({});
      return;
    }
    let cancelled = false;
    void buildTecdocArticlesRemusaMap(list)
      .then((m) => {
        if (!cancelled) setLookupRemusaMap(m);
      })
      .catch(() => {
        if (!cancelled) setLookupRemusaMap({});
      });
    return () => {
      cancelled = true;
    };
  }, [lookupKey, panel]);

  const openArticle = (a: Record<string, unknown>, map: Record<string, TecdocArticleRemusaEntry>) => {
    const id = String(a.articleId ?? "");
    setSheetArticle(a);
    setSheetRemusa(map[id] ?? null);
    setSheetOpen(true);
  };

  const goBackCategory = () => {
    setCatStack((s) => s.slice(0, -1));
    setSelectedLeafId(null);
    setArticles([]);
    setRemusaArticleMap({});
  };

  const onPickCategoryNode = (n: TecdocCatNode) => {
    if (tecdocCategoryHasChildren(n)) {
      setCatStack((s) => [...s, { id: n.id, name: n.name }]);
      setSelectedLeafId(null);
      setArticles([]);
      setRemusaArticleMap({});
    } else {
      void loadArticles(n.id);
      setCatStack((s) => [...s, { id: n.id, name: n.name }]);
    }
  };

  const tecdocCategoryNavLoading =
    panel === "1" &&
    loadingKey != null &&
    (loadingKey === "categories" || loadingKey === "articles");

  const dockCtx = useCatalogDockContext();
  const scrollCatalogNavIntoView = dockCtx?.scrollCatalogNavIntoView;
  const setNavAnchorRef = useCallback((el: HTMLDivElement | null) => {
    dockCtx?.registerCatalogNavAnchor(el);
  }, [dockCtx]);
  const prevLoadingKeyRef = useRef<TecdocLoadingKey | null>(null);
  useEffect(() => {
    if (prevLoadingKeyRef.current != null && loadingKey == null) {
      scrollCatalogNavIntoView?.();
    }
    prevLoadingKeyRef.current = loadingKey;
  }, [loadingKey, scrollCatalogNavIntoView]);

  const renderArticleRows = (
    list: Array<Record<string, unknown>>,
    map: Record<string, TecdocArticleRemusaEntry>,
    opts: { showRemusaSummary?: boolean } = {},
  ) => {
    const showSummary = opts.showRemusaSummary !== false;
    return (
      <>
        {showSummary && list.length > 0 ? (
          remusaBatchLoading && panel === "1" ? (
            <p className="font-mono text-[11px] text-neutral-500">Cruce con REMUSA…</p>
          ) : matchCount > 0 && panel === "1" ? (
            <p className="font-mono text-[11px] font-medium text-[#75141C]">
              {matchCount} artículo{matchCount === 1 ? "" : "s"} en REMUSA
            </p>
          ) : panel === "1" ? (
            <p className="font-mono text-[11px] text-neutral-500">
              Sin coincidencia directa en REMUSA (códigos aftermarket / OEM en detalle).
            </p>
          ) : null
        ) : null}
        <ul className="mt-2 flex flex-col gap-3">
          {list.map((a, i) => {
            const aid = String(a.articleId ?? i);
            const no = String(a.articleNo ?? a.articleNumber ?? aid);
            const name = String(
              a.articleProductName ?? a.genericArticleDescription ?? a.articleName ?? "",
            );
            const hit = map[aid];
            const thumb = articleThumb(a);
            const codeLineClass =
              "font-mono text-[12px] font-semibold leading-snug text-neutral-900";
            return (
              <li key={`${no}-${i}`}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => openArticle(a, map)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      ev.preventDefault();
                      openArticle(a, map);
                    }
                  }}
                  className={`flex cursor-pointer gap-3 rounded-xl border border-neutral-200/80 bg-white p-3 shadow-sm transition-[box-shadow,border-color] hover:border-neutral-300/90 hover:shadow-md ${
                    hit ? "ring-1 ring-[#75141C]/12" : ""
                  }`}
                >
                  <div
                    className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={no}
                        className="h-28 w-28 rounded-xl border border-neutral-200/80 bg-white object-contain sm:h-32 sm:w-32"
                      />
                    ) : (
                      <div className="flex h-28 w-28 items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-100/80 px-1 text-center font-mono text-[9px] text-neutral-400 sm:h-32 sm:w-32">
                        sin img
                      </div>
                    )}
                    {thumb ? (
                      <button
                        type="button"
                        onClick={() => setImgLightbox({ src: thumb, alt: no })}
                        className="absolute bottom-1 right-1 z-10 flex items-center gap-1 rounded-lg border border-neutral-200/90 bg-white/95 px-2 py-1 font-mono text-[10px] font-medium text-neutral-800 shadow-sm backdrop-blur-sm transition hover:bg-white"
                        aria-label="Ver imagen"
                      >
                        <HiArrowsPointingOut className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Ver
                      </button>
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className={codeLineClass}>
                      {hit ? <span className="text-[#75141C]">★ </span> : null}
                      {no}
                    </p>
                    {name ? (
                      <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">{name}</p>
                    ) : null}
                    {hit ? (
                      <div className="mt-2.5 border-t border-neutral-100 pt-2.5">
                        <p className="font-mono text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                          Código REMUSA
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] font-semibold text-[#75141C]">
                          {hit.hit.articulo}
                          <span className="font-normal text-neutral-500">
                            {" "}
                            · {hit.hit.source}
                          </span>
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] text-neutral-500">
                          vía {hit.matched_via}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <TecdocCatalogFloatingDock onSelect={onMenuSelect} activePanelId={panel} />

      {loadingKey && panel && !tecdocCategoryNavLoading && (
        <TerminalLoader
          messages={[...TECDOC_LOADING_MESSAGES[loadingKey]]}
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
        <div ref={setNavAnchorRef} className="flex min-w-0 flex-col gap-3">
          {tecdocCategoryNavLoading && loadingKey ? (
            <TerminalLoader
              messages={[...TECDOC_LOADING_MESSAGES[loadingKey]]}
              active
              variant="light"
            />
          ) : (
            <div className={HUB_CARD_SHELL}>
              <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                {" > categorías TecDoc"}
              </p>
              {catStack.length > 0 && (
                <button
                  type="button"
                  onClick={goBackCategory}
                  className="mt-3 min-h-[40px] w-full rounded-xl border border-neutral-200/80 bg-white px-3 py-2 text-left text-sm font-medium text-neutral-800 shadow-sm transition hover:border-neutral-300/90 hover:bg-neutral-50/90 sm:w-auto"
                >
                  ← Volver nivel
                </button>
              )}
              {catStack.length > 0 && (
                <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                  {catStack.map((c) => c.name).join(" → ")}
                </p>
              )}
              <ul className="mt-2 space-y-1.5">
                {currentCategories.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => onPickCategoryNode(n)}
                      className="flex w-full items-center gap-2 rounded-lg border border-neutral-200/80 bg-white p-2 text-left shadow-sm transition-[box-shadow,border-color] hover:border-neutral-300/90 hover:shadow"
                    >
                      <div
                        className="h-11 w-11 shrink-0 rounded-md border border-neutral-200/80 bg-neutral-100/90"
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 py-0.5">
                        <span className="line-clamp-2 text-[13px] font-medium leading-snug text-neutral-800">
                          {n.name}
                          {tecdocCategoryHasChildren(n) ? (
                            <span className="ml-1.5 text-[10px] font-normal uppercase tracking-wide text-neutral-400">
                              · Subcategorías
                            </span>
                          ) : (
                            <span className="ml-1.5 text-[10px] font-normal uppercase tracking-wide text-neutral-400">
                              · Partes
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {articles.length > 0 && (
                <div className="mt-3 space-y-3 border-t border-neutral-100 pt-3">
                  {renderArticleRows(sortedArticles, remusaArticleMap)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {panel === "2" && (
        <div className={`${HUB_CARD_SHELL} space-y-2`}>
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            {" > buscar OEM TecDoc"}
          </p>
          <input
            value={oemQ}
            onChange={(e) => setOemQ(e.target.value)}
            className={HUB_INPUT}
            placeholder="Número OEM"
          />
          <button
            type="button"
            onClick={() => void onMenuSelectContinue({ id: "2", title: "", subtitle: "" })}
            className={HUB_PRIMARY_BTN}
          >
            Buscar
          </button>
          {lookupArticlesOem.length > 0 ? (
            <div className="mt-2">
              <p className="mb-1 font-mono text-[10px] text-neutral-500">
                {lookupArticlesOem.length} artículo(s) · toque para detalle
              </p>
              {Object.keys(lookupRemusaMap).length > 0 ? (
                <p className="mb-2 font-mono text-[11px] font-medium text-[#75141C]">
                  {Object.keys(lookupRemusaMap).length} con coincidencia REMUSA
                </p>
              ) : (
                <p className="mb-2 font-mono text-[11px] text-neutral-500">
                  Sin coincidencia directa REMUSA en lista (ver OEM en detalle).
                </p>
              )}
              {renderArticleRows(lookupArticlesOem, lookupRemusaMap, { showRemusaSummary: false })}
            </div>
          ) : oemRes ? (
            <pre className="wrap-break-word overflow-x-auto rounded-xl border border-neutral-200/80 bg-neutral-900 p-3 font-mono text-[10px] leading-relaxed text-emerald-100 whitespace-pre-wrap shadow-inner">
              {JSON.stringify(oemRes, null, 2)}
            </pre>
          ) : null}
        </div>
      )}

      {panel === "3" && (
        <div className={`${HUB_CARD_SHELL} space-y-2`}>
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            {" > aftermarket TecDoc"}
          </p>
          <input
            value={aftQ}
            onChange={(e) => setAftQ(e.target.value)}
            className={HUB_INPUT}
            placeholder="OEM para cruce"
          />
          <button
            type="button"
            onClick={() => void onMenuSelectContinue({ id: "3", title: "", subtitle: "" })}
            className={HUB_PRIMARY_BTN}
          >
            Buscar
          </button>
          {lookupArticlesAft.length > 0 ? (
            <div className="mt-2">
              <p className="mb-1 font-mono text-[10px] text-neutral-500">
                {lookupArticlesAft.length} artículo(s) · toque para detalle
              </p>
              {Object.keys(lookupRemusaMap).length > 0 ? (
                <p className="mb-2 font-mono text-[11px] font-medium text-[#75141C]">
                  {Object.keys(lookupRemusaMap).length} con coincidencia REMUSA
                </p>
              ) : (
                <p className="mb-2 font-mono text-[11px] text-neutral-500">
                  Sin coincidencia directa REMUSA en lista (ver OEM en detalle).
                </p>
              )}
              {renderArticleRows(lookupArticlesAft, lookupRemusaMap, { showRemusaSummary: false })}
            </div>
          ) : aftRes ? (
            <pre className="wrap-break-word overflow-x-auto rounded-xl border border-neutral-200/80 bg-neutral-900 p-3 font-mono text-[10px] leading-relaxed text-emerald-100 whitespace-pre-wrap shadow-inner">
              {JSON.stringify(aftRes, null, 2)}
            </pre>
          ) : null}
        </div>
      )}

      {panel === "4" && (
        <div className={`${HUB_CARD_SHELL} space-y-2`}>
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            {" > precio 4S"}
          </p>
          <input
            value={pricePn}
            onChange={(e) => setPricePn(e.target.value)}
            className={HUB_INPUT}
            placeholder="Número OEM"
          />
          <button
            type="button"
            onClick={() => void onMenuSelectContinue({ id: "4", title: "", subtitle: "" })}
            className={HUB_PRIMARY_BTN}
          >
            Consultar
          </button>
          {priceData != null && (
            <pre className="wrap-break-word overflow-x-auto rounded-xl border border-neutral-200/80 bg-neutral-900 p-3 font-mono text-[10px] leading-relaxed text-emerald-100 whitespace-pre-wrap shadow-inner">
              {JSON.stringify(priceData, null, 2)}
            </pre>
          )}
        </div>
      )}

      {panel === "5" && (
        <div className={`${HUB_CARD_SHELL} space-y-2`}>
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            {" > inventario REMUSA"}
          </p>
          <input
            value={rmPn}
            onChange={(e) => setRmPn(e.target.value)}
            className={HUB_INPUT}
            placeholder="Código de parte"
          />
          <button
            type="button"
            onClick={() => void onMenuSelectContinue({ id: "5", title: "", subtitle: "" })}
            className={HUB_PRIMARY_BTN}
          >
            Buscar
          </button>
          {rmRes && (
            <pre className="wrap-break-word overflow-x-auto rounded-xl border border-neutral-200/80 bg-neutral-900 p-3 font-mono text-[10px] leading-relaxed text-emerald-100 whitespace-pre-wrap shadow-inner">
              {JSON.stringify(rmRes, null, 2)}
            </pre>
          )}
        </div>
      )}

      <TecdocArticleDetailSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setSheetArticle(null);
          setSheetRemusa(null);
        }}
        vehicleId={vid}
        listArticle={sheetArticle}
        remusaEntry={sheetRemusa}
      />

      {imgLightbox ? (
        <DiagramLightbox
          open
          onClose={() => setImgLightbox(null)}
          src={imgLightbox.src}
          alt={imgLightbox.alt}
        />
      ) : null}
    </div>
  );
}
