import { useCallback, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import {
  HiOutlineIdentification,
  HiOutlineWrenchScrewdriver,
  HiOutlineArrowRightOnRectangle,
  HiOutlineUserCircle,
  HiChevronDown,
} from "react-icons/hi2";
import { PiBarcodeBold } from "react-icons/pi";
import { motion, AnimatePresence } from "framer-motion";
import SearchInput from "../components/search/SearchInput";
import TerminalLoader from "../components/search/TerminalLoader";
import ResultsDisplay from "../components/results/ResultsDisplay";
import PlateNotFoundToast from "../components/search/PlateNotFoundToast";
import { useSearch } from "../hooks/useSearch";
import type { LayoutOutletContext } from "../components/layout/Layout";
import type { SearchMode } from "../types";
import {
  CatalogDockProvider,
  useCatalogDockContext,
} from "../contexts/CatalogDockContext";
import {
  ResultsInfoCollapseProvider,
  useResultsInfoCollapse,
} from "../contexts/ResultsInfoCollapseContext";

const CARD_BRAND = "#75141C";
const CARD_BLUE = "#4A9ED1";
const CARD_DARK = "#212124";

const expandEase = [0.32, 0.72, 0, 1] as const;
/** Height-only avoids opacity+auto-height fighting at end of tween (layout “jump” / margin glitch). */
const expandTransition = {
  height: { duration: 0.52, ease: expandEase },
};
const chevronTransition = {
  duration: 0.48,
  ease: [0.25, 0.1, 0.25, 1] as const,
};

/** Snap Resultados panel flush to the top. */
const RESULTADOS_PANEL_TOP_GAP_PX = 24;

/**
 * Outermost ancestor that actually scrolls vertically.
 * On mobile, this prefers the page/main scroller over nested pane scrollers.
 */
function findScrollableOverflowParent(el: HTMLElement): HTMLElement | null {
  let p: HTMLElement | null = el.parentElement;
  let candidate: HTMLElement | null = null;
  while (p) {
    const { overflowY } = window.getComputedStyle(p);
    if (
      overflowY === "auto" ||
      overflowY === "scroll" ||
      overflowY === "overlay"
    ) {
      if (p.scrollHeight > p.clientHeight + 2) {
        candidate = p;
      }
    }
    p = p.parentElement;
  }
  return candidate;
}

/** Scroll so the target’s top sits a few pixels below the scrollport top (like iOS screenshot). */
function scrollBlockIntoViewWithTopGap(el: HTMLElement, gapPx: number) {
  const scrollParent = findScrollableOverflowParent(el);
  if (!scrollParent) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  const elRect = el.getBoundingClientRect();
  const spRect = scrollParent.getBoundingClientRect();
  const nextTop = scrollParent.scrollTop + (elRect.top - spRect.top) - gapPx;
  scrollParent.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
}

function MainPageContent() {
  const { openChat } = useOutletContext<LayoutOutletContext>();
  const {
    setLeftPaneDockNode,
    registerScrollResultsPanelToTop,
    registerCatalogNavAnchorImpl,
    registerScrollCatalogNavIntoView,
    suppressLeftPaneCatalogInlineDim,
    restoreCatalogInlineDim,
  } = useCatalogDockContext()!;
  const infoCollapse = useResultsInfoCollapse();

  const {
    state,
    toggleBlock,
    handlePlateSearch,
    handleVinSearch,
    handlePartSearch,
    resetResults,
    selectTecdocModel,
    selectTecdocVehicle,
    dismissPlateNotFoundToast,
  } = useSearch();

  /** The light gray Resultados panel — scroll this to the top after Buscar. */
  const resultsRef = useRef<HTMLElement>(null);
  /** Catalog hub block (e.g. “navegación categorías”), below VIN/placa cards. */
  const catalogNavAnchorRef = useRef<HTMLElement | null>(null);
  const prevLoadingRef = useRef(false);

  const hasDisplayData = Boolean(
    state.vehicleInfo ||
    state.vinDecode ||
    state.partResults.length > 0 ||
    state.catalogSession ||
    (state.tecdocPicklist && state.tecdocPicklist.length > 0) ||
    (state.tecdocModelPicklist && state.tecdocModelPicklist.length > 0),
  );

  const scrollResultsPanelToTop = useCallback(() => {
    const el = resultsRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollBlockIntoViewWithTopGap(el, RESULTADOS_PANEL_TOP_GAP_PX);
      });
    });
  }, []);

  const registerCatalogNavAnchor = useCallback((el: HTMLElement | null) => {
    catalogNavAnchorRef.current = el;
  }, []);

  /** Prefer the catalog block so VIN cards above don’t hide “navegación categorías”. */
  const scrollCatalogNavIntoView = useCallback(() => {
    const el = catalogNavAnchorRef.current ?? resultsRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollBlockIntoViewWithTopGap(el, RESULTADOS_PANEL_TOP_GAP_PX);
      });
    });
  }, []);

  useEffect(() => {
    registerScrollResultsPanelToTop(scrollResultsPanelToTop);
    return () => registerScrollResultsPanelToTop(null);
  }, [registerScrollResultsPanelToTop, scrollResultsPanelToTop]);

  useEffect(() => {
    registerCatalogNavAnchorImpl(registerCatalogNavAnchor);
    return () => registerCatalogNavAnchorImpl(null);
  }, [registerCatalogNavAnchorImpl, registerCatalogNavAnchor]);

  useEffect(() => {
    registerScrollCatalogNavIntoView(scrollCatalogNavIntoView);
    return () => registerScrollCatalogNavIntoView(null);
  }, [registerScrollCatalogNavIntoView, scrollCatalogNavIntoView]);

  /** After Buscar: scroll so the #ececf0 Resultados block is at the top of the scroll view. */
  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    prevLoadingRef.current = state.loading;
    if (wasLoading && !state.loading && resultsRef.current) {
      scrollResultsPanelToTop();
    }
  }, [state.loading, scrollResultsPanelToTop]);

  const triggerInfoCardsExpand = infoCollapse?.triggerInfoCardsExpand;
  /** After each plate or VIN search that yields registro / decodificación, show full cards.
   * Do not depend on the whole context object — collapseTick updates would re-run this and re-expand. */
  useEffect(() => {
    if (state.vehicleInfo == null && state.vinDecode == null) return;
    triggerInfoCardsExpand?.();
  }, [state.vehicleInfo, state.vinDecode, triggerInfoCardsExpand]);

  const onCardClick = (mode: SearchMode) => {
    toggleBlock(mode);
  };

  const partOpen = state.activeBlock === "partCode";
  const vinOpen = state.activeBlock === "vin";

  const plateLoading = state.loading && state.activeBlock === "plate";

  const showPlateBlock =
    state.activeBlock !== "partCode" && state.activeBlock !== "vin";

  /** Same idea as part/VIN: plate “open” when not hidden behind part or VIN. */
  const plateOpen = showPlateBlock;

  return (
    <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col bg-[#0b0b0c]">
      <header className="hidden w-full shrink-0 border-b border-white/10 bg-[#f5f5f5] lg:grid lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-4 lg:px-8 lg:py-3.5">
        <button
          type="button"
          onClick={openChat}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-[#75141C] transition-all duration-300 hover:border-[#75141C]/50 hover:bg-[#75141C]/15"
          aria-label="Asistente"
        >
          <HiOutlineUserCircle className="text-2xl" />
        </button>
        <div className="flex min-w-0 justify-center px-2">
          <img
            src="/logo.webp"
            alt="Remusa AI"
            className="h-10 w-auto max-h-14 max-w-[min(240px,42vw)] object-contain object-center lg:h-12"
            decoding="async"
          />
        </div>
        <button
          type="button"
          className="shrink-0 justify-self-end rounded-lg p-2 text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-200"
          aria-label="Cerrar sesión"
        >
          <HiOutlineArrowRightOnRectangle className="text-xl" />
        </button>
      </header>

      <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col lg:flex-row">
        {/* Left: slot menú catálogo (lg+ arriba) + búsqueda placa / parte / VIN */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col border-white/10 lg:w-1/2 lg:min-h-0 lg:border-r">
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div
              ref={setLeftPaneDockNode}
              className="pointer-events-none absolute inset-0 z-40 min-h-0"
            />
            <div
              className="relative z-0 flex min-h-0 flex-1 flex-col overflow-x-hidden lg:overflow-y-auto lg:overscroll-contain"
              onPointerDown={() => {
                suppressLeftPaneCatalogInlineDim();
              }}
            >
              <section className="rounded-b-[36px] bg-white px-4 pb-6 pt-3 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.35)] sm:rounded-b-[40px] lg:mb-6 lg:rounded-none lg:bg-transparent lg:px-8 lg:pb-0 lg:pt-4 lg:shadow-none">
                <div className="flex items-center justify-between lg:hidden">
                  <button
                    type="button"
                    onClick={openChat}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-[#75141C] transition-all duration-300 hover:scale-105 hover:border-[#75141C]/35 hover:bg-[#75141C]/10 active:scale-95"
                    aria-label="Asistente"
                  >
                    <HiOutlineUserCircle className="text-2xl" />
                  </button>
                  <div className="flex min-w-0 flex-1 justify-center px-1">
                    <img
                      src="/logo.webp"
                      alt="Remusa AI"
                      className="h-10 max-h-14 w-auto max-w-[min(220px,52vw)] object-contain object-center lg:h-16"
                      decoding="async"
                    />
                  </div>
                  <button
                    type="button"
                    disabled
                    className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-full border border-neutral-200 text-neutral-400 opacity-50"
                    aria-label="Salir"
                  >
                    <HiOutlineArrowRightOnRectangle className="text-lg" />
                  </button>
                </div>

                <div className="mt-6 min-w-0 w-full">
                  <div
                    className="min-w-0 w-full overflow-hidden rounded-[28px] shadow-[0_12px_32px_-16px_rgba(0,0,0,0.35)]"
                    style={{ backgroundColor: CARD_BRAND }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleBlock("plate")}
                      className="flex w-full items-start justify-between gap-3 p-6 text-left text-white transition-transform duration-200 active:scale-[0.99] lg:p-7"
                      aria-expanded={plateOpen}
                      aria-label={
                        plateOpen
                          ? "Colapsar busqueda por placa"
                          : "Abrir busqueda por placa"
                      }
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-sm font-medium text-white/95">
                          <span className="opacity-90">•</span>
                          <span>Placa</span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <HiOutlineIdentification className="shrink-0 text-2xl opacity-95 sm:text-[28px]" />
                          <span className="text-2xl font-bold tracking-tight sm:text-3xl">
                            Buscar por placa
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-white/85">
                          Registro Costa Rica
                        </p>
                      </div>
                      <motion.span
                        animate={{ rotate: plateOpen ? 180 : 0 }}
                        transition={chevronTransition}
                        className="mt-1 shrink-0 text-white/90"
                        aria-hidden
                      >
                        <HiChevronDown className="text-2xl" />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {plateOpen && (
                        <motion.div
                          key="plate-body"
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          transition={expandTransition}
                          className="overflow-hidden border-t border-white/25"
                        >
                          <div className="bg-black/15 px-5 pb-6 pt-4 transition-colors duration-200 hover:bg-black/20 lg:px-7 lg:pb-7">
                            <p className="mb-3 text-sm leading-relaxed text-white/95">
                              Ingrese la placa del vehiculo (ej. SCS-199). Se
                              consultara el Registro y se decodificara el VIN
                              cuando este disponible.
                            </p>
                            <SearchInput
                              placeholder="Ej: SCS-199"
                              onSearch={handlePlateSearch}
                              loading={state.loading}
                              variant="dark"
                            />
                            <AnimatePresence>
                              {plateLoading && (
                                <TerminalLoader
                                  messages={state.loadingMessages}
                                  active
                                  variant="dark"
                                />
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </section>

              <div className="flex w-full min-w-0 flex-col gap-3.5 px-3 pb-4 pt-5 lg:gap-4 lg:px-8 lg:pt-0">
                <div
                  className="min-w-0 w-full overflow-hidden rounded-[28px] shadow-[0_12px_32px_-16px_rgba(0,0,0,0.45)] transition-shadow duration-300"
                  style={{ backgroundColor: CARD_BLUE }}
                >
                  <button
                    type="button"
                    onClick={() => onCardClick("partCode")}
                    className="flex w-full items-start justify-between gap-3 p-6 text-left text-white transition-transform duration-200 active:scale-[0.99] lg:p-7"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium text-white/95">
                        <span className="opacity-90">•</span>
                        <span>Parte</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <PiBarcodeBold className="shrink-0 text-2xl opacity-90" />
                        <span className="text-2xl font-bold tracking-tight sm:text-3xl">
                          Codigo de parte
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-white/85">
                        OEM o alterno
                      </p>
                    </div>
                    <motion.span
                      animate={{ rotate: partOpen ? 180 : 0 }}
                      transition={chevronTransition}
                      className="mt-1 shrink-0 text-white/90"
                    >
                      <HiChevronDown className="text-2xl" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {partOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={expandTransition}
                        className="overflow-hidden border-t border-white/25"
                      >
                        <div className="bg-black/15 px-5 pb-6 pt-4 transition-colors duration-200 hover:bg-black/20 lg:px-7 lg:pb-7">
                          <p className="mb-3 text-sm leading-relaxed text-white/95">
                            Escribe el codigo de pieza para buscar en el
                            catalogo EPC (coincidencia exacta o smart).
                          </p>
                          <SearchInput
                            placeholder="Ej: 04465-42180"
                            onSearch={handlePartSearch}
                            loading={state.loading}
                            variant="dark"
                          />
                          <AnimatePresence>
                            {state.loading &&
                              partOpen &&
                              state.activeBlock === "partCode" && (
                                <TerminalLoader
                                  messages={state.loadingMessages}
                                  active
                                  variant="dark"
                                />
                              )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div
                  className="min-w-0 w-full overflow-hidden rounded-[28px] shadow-[0_12px_32px_-16px_rgba(0,0,0,0.45)] transition-shadow duration-300"
                  style={{ backgroundColor: CARD_DARK }}
                >
                  <button
                    type="button"
                    onClick={() => onCardClick("vin")}
                    className="flex w-full items-start justify-between gap-3 p-6 text-left text-white transition-transform duration-200 active:scale-[0.99] lg:p-7"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium text-white/95">
                        <span className="opacity-90">•</span>
                        <span>VIN</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <HiOutlineWrenchScrewdriver className="shrink-0 text-2xl opacity-90" />
                        <span className="text-2xl font-bold tracking-tight sm:text-3xl">
                          Numero VIN
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-white/85">
                        17 caracteres
                      </p>
                    </div>
                    <motion.span
                      animate={{ rotate: vinOpen ? 180 : 0 }}
                      transition={chevronTransition}
                      className="mt-1 shrink-0 text-white/90"
                    >
                      <HiChevronDown className="text-2xl" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {vinOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={expandTransition}
                        className="overflow-hidden border-t border-white/15"
                      >
                        <div className="bg-black/25 px-5 pb-6 pt-4 transition-colors duration-200 hover:bg-black/30 lg:px-7 lg:pb-7">
                          <p className="mb-3 text-sm leading-relaxed text-white/90">
                            Escribe el VIN de 17 caracteres para obtener EPC,
                            modelo, motor y datos de fabricacion.
                          </p>
                          <SearchInput
                            placeholder="VIN (17 caracteres)"
                            onSearch={handleVinSearch}
                            loading={state.loading}
                            variant="dark"
                          />
                          <AnimatePresence>
                            {state.loading &&
                              vinOpen &&
                              state.activeBlock === "vin" && (
                                <TerminalLoader
                                  messages={state.loadingMessages}
                                  active
                                  variant="dark"
                                />
                              )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: resultados (scroll independiente en lg+) */}
        <div
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden lg:w-1/2 lg:overflow-y-auto lg:overscroll-contain"
          onPointerDown={() => {
            restoreCatalogInlineDim();
          }}
        >
          <AnimatePresence>
            {state.error && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mx-3 mt-4 rounded-2xl border border-red-500/25 bg-red-500/15 px-4 py-3 text-sm text-red-300 lg:mx-8"
              >
                {state.error}
              </motion.div>
            )}
          </AnimatePresence>

          <section
            ref={resultsRef}
            className="mx-3 mb-6 mt-4 scroll-mt-6 min-w-0 rounded-[28px] border border-neutral-200/80 bg-[#f5f5f5] p-4 shadow-inner lg:mx-8 lg:mb-8 lg:mt-6 lg:scroll-mt-8 lg:flex-1 lg:p-6"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Resultados
            </p>
            <div className="mt-3">
              {!hasDisplayData ? (
                <p className="px-2 py-10 text-center text-sm text-neutral-500">
                  Busca por placa, codigo de parte o VIN para ver la informacion
                  aqui.
                </p>
              ) : (
                <ResultsDisplay
                  vehicleInfo={state.vehicleInfo}
                  vinDecode={state.vinDecode}
                  vinDecodeRaw={state.vinDecodeRaw}
                  partResults={state.partResults}
                  partRemusaMap={state.partRemusaMap}
                  partDirectRemusa={state.partDirectRemusa}
                  catalogSession={state.catalogSession}
                  tecdocModelPicklist={state.tecdocModelPicklist}
                  tecdocPicklist={state.tecdocPicklist}
                  onResetCatalog={resetResults}
                  onSelectTecdocModel={selectTecdocModel}
                  onSelectTecdocVehicle={selectTecdocVehicle}
                />
              )}
            </div>
          </section>
        </div>
      </div>

      <PlateNotFoundToast
        show={state.plateNotFoundToast}
        onDismiss={dismissPlateNotFoundToast}
      />
    </div>
  );
}

export default function MainPage() {
  return (
    <CatalogDockProvider>
      <ResultsInfoCollapseProvider>
        <MainPageContent />
      </ResultsInfoCollapseProvider>
    </CatalogDockProvider>
  );
}
