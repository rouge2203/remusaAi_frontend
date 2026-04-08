import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HiChevronDown, HiChevronUp } from "react-icons/hi2";
import type { MenuItem } from "../../constants/remusaMenu";
import { MenuTerminalRow } from "../menu/MenuTerminalRow";
import { useCatalogDockContext } from "../../contexts/CatalogDockContext";
import { useResultsInfoCollapse } from "../../contexts/ResultsInfoCollapseContext";
import { useMediaQuery } from "../../hooks/useMediaQuery";

/** Mobile / narrow: anchored to bottom of viewport (safe area). */
const shellOuterFixed =
  "pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col justify-end items-stretch pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]";

/**
 * Split layout: dimmed overlay over search blocks — `pointer-events-none` so placa/part/vin
 * stay clickable; only the menu card uses `pointer-events-auto`.
 * When the user presses the search column, dim is cleared; it returns after using the catalog
 * menu or the Resultados pane again.
 */
const shellOuterInline =
  "pointer-events-none relative z-10 flex h-full min-h-0 w-full flex-col justify-end bg-black/45 pb-4 pt-0 sm:pb-5 lg:pb-6";

const shellOuterInlineNoDim =
  "pointer-events-none relative z-10 flex h-full min-h-0 w-full flex-col justify-end pb-4 pt-0 sm:pb-5 lg:pb-6";

/** Menu width: 90% centered (mobile + iPad; fixed bottom dock). */
const shellColumnFixed =
  "pointer-events-none mx-auto w-[90%] max-w-[90%] min-w-0";

/** Left pane overlay: same 90% width when dock is inline (e.g. iPad / split layout). */
const shellColumnInline =
  "pointer-events-none mx-auto flex h-full min-h-0 w-[90%] max-w-[90%] min-w-0 flex-1 flex-col justify-end";

const shellInsetWithResultCards = "pointer-events-none w-full min-w-0 px-0";

const shellInsetInline = "pointer-events-none w-full min-w-0 px-0";

/** Primary brand red (matches search CTA / accents). */
const cardShell =
  "pointer-events-auto w-full max-w-full min-w-0 overflow-hidden rounded-[28px] bg-gradient-to-b from-[#8f2330] to-[#75141C] shadow-[0_12px_32px_-16px_rgba(0,0,0,0.45)] transition-shadow duration-300";

/** Expanded: grows with content; scrolls as one panel only if taller than viewport. */
const cardExpanded = `${cardShell} flex max-h-[min(94vh,920px)] flex-col !overflow-y-auto overscroll-contain`;

const cardExpandedInline = `${cardShell} flex max-h-[min(94vh,920px)] w-full flex-col !overflow-y-auto overscroll-contain`;

export interface CatalogFloatingDockProps {
  onSelect: (item: MenuItem) => void;
  activePanelId: string | null;
  allItems: MenuItem[];
  primaryItems: MenuItem[];
  moreItems: MenuItem[];
  headerTitle: string;
  fallbackMenuTitle: string;
  fallbackMenuSubtitle?: string;
  ariaLabel: string;
}

export default function CatalogFloatingDock({
  onSelect,
  activePanelId,
  allItems,
  primaryItems,
  moreItems,
  headerTitle,
  fallbackMenuTitle,
  fallbackMenuSubtitle = "Elegir acción",
  ariaLabel,
}: CatalogFloatingDockProps) {
  const [minimized, setMinimized] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const dockCtx = useCatalogDockContext();
  const infoCollapse = useResultsInfoCollapse();
  const splitLayout = useMediaQuery("(min-width: 1024px)");
  const leftPaneEl = dockCtx?.leftPaneDockNode ?? null;
  const dockInline = Boolean(splitLayout && leftPaneEl);
  const inlineDimSuppressed = dockCtx?.leftPaneInlineDimSuppressed ?? false;
  const restoreCatalogInlineDim = dockCtx?.restoreCatalogInlineDim;

  useEffect(() => {
    if (dockInline) {
      document.body.classList.remove("catalog-floating-dock-open");
      document.body.classList.add("catalog-floating-dock-inline");
      return () => document.body.classList.remove("catalog-floating-dock-inline");
    }
    document.body.classList.add("catalog-floating-dock-open");
    document.body.classList.remove("catalog-floating-dock-inline");
    return () => document.body.classList.remove("catalog-floating-dock-open");
  }, [dockInline]);

  useEffect(
    () => () => {
      restoreCatalogInlineDim?.();
    },
    [restoreCatalogInlineDim],
  );

  const activeItem = useMemo(
    () => allItems.find((i) => i.id === activePanelId) ?? null,
    [allItems, activePanelId],
  );

  const handleSelect = (item: MenuItem) => {
    onSelect(item);
    setMoreOpen(false);
    setMinimized(true);
    infoCollapse?.triggerInfoCardsCollapse();
  };

  const handleMinimize = () => {
    setMoreOpen(false);
    setMinimized(true);
  };

  const expandDock = () => {
    restoreCatalogInlineDim?.();
    setMinimized(false);
  };

  const outerClass = dockInline
    ? inlineDimSuppressed
      ? shellOuterInlineNoDim
      : shellOuterInline
    : shellOuterFixed;
  const columnClass = dockInline ? shellColumnInline : shellColumnFixed;
  const insetClass = dockInline ? shellInsetInline : shellInsetWithResultCards;
  const expandedCardClass = dockInline ? cardExpandedInline : cardExpanded;

  const dock = (
    <div className={outerClass}>
      <div className={columnClass}>
        <div className={insetClass}>
            <AnimatePresence mode="wait">
              {minimized ? (
                <motion.div
                  key="min"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className={cardShell}
                  role="dialog"
                  aria-modal="true"
                  aria-label={ariaLabel}
                  onPointerDownCapture={() => {
                    restoreCatalogInlineDim?.();
                  }}
                >
                  <div className="flex min-h-[56px] items-center gap-2 px-3 py-3.5">
                    <button
                      type="button"
                      onClick={expandDock}
                      className="min-w-0 flex-1 text-left"
                    >
                      {activeItem ? (
                        <>
                          <p className="truncate font-mono text-[13px] font-semibold capitalize text-white">
                            <span className="font-normal text-white/45">{"> "}</span>
                            {activeItem.title}
                          </p>
                          {activeItem.subtitle ? (
                            <p className="truncate pl-3 font-mono text-[10px] text-white/60">
                              {activeItem.subtitle}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <p className="font-mono text-[13px] font-semibold text-white">
                            <span className="font-normal text-white/45">{"> "}</span>
                            {fallbackMenuTitle}
                          </p>
                          <p className="pl-3 font-mono text-[10px] text-white/60">{fallbackMenuSubtitle}</p>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={expandDock}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 text-white/85 hover:bg-white/10"
                      aria-label="Expandir menú"
                    >
                      <HiChevronUp className="text-xl" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="exp"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className={expandedCardClass}
                  role="dialog"
                  aria-modal="true"
                  aria-label={ariaLabel}
                  onPointerDownCapture={() => {
                    restoreCatalogInlineDim?.();
                  }}
                >
                  <div className="flex shrink-0 items-start justify-between gap-2 border-b border-white/15 px-3 py-2">
                    <p className="pt-0.5 font-mono text-[10px] font-medium uppercase tracking-widest text-white/45">
                      {headerTitle}
                    </p>
                    <button
                      type="button"
                      onClick={handleMinimize}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/70 hover:bg-white/10"
                      aria-label="Minimizar menú"
                    >
                      <HiChevronDown className="text-lg" />
                    </button>
                  </div>
                  <div className="p-3 pt-2">
                    <ul className="flex flex-col gap-1">
                      {primaryItems.map((item) => (
                        <li key={item.id}>
                          <MenuTerminalRow
                            item={item}
                            active={activePanelId === item.id}
                            onSelect={handleSelect}
                            variant="dark"
                          />
                        </li>
                      ))}
                    </ul>
                    <AnimatePresence initial={false}>
                      {moreOpen && moreItems.length > 0 && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <ul className="mt-2 space-y-1 border-t border-white/15 pt-2">
                            {moreItems.map((item) => (
                              <li key={item.id}>
                                <MenuTerminalRow
                                  item={item}
                                  active={activePanelId === item.id}
                                  onSelect={handleSelect}
                                  variant="dark"
                                />
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {moreItems.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setMoreOpen((v) => !v)}
                        className="mt-2 flex min-h-[40px] w-full items-center justify-center rounded-xl border border-dashed border-white/30 bg-black/15 px-3 py-2 font-mono text-[12px] font-semibold text-white/85 hover:bg-white/10"
                        aria-expanded={moreOpen}
                      >
                        {moreOpen ? "Mostrar menos" : "Más opciones"}
                      </button>
                    ) : null}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  const target = dockInline && leftPaneEl ? leftPaneEl : document.body;
  return createPortal(dock, target);
}
