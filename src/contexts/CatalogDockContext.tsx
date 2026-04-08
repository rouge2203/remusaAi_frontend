import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type CatalogDockContextValue = {
  leftPaneDockNode: HTMLElement | null;
  setLeftPaneDockNode: (el: HTMLElement | null) => void;
  /** Whole Resultados section — after Buscar. */
  scrollResultsPanelToTop: () => void;
  registerScrollResultsPanelToTop: (fn: (() => void) | null) => void;
  /** MainPage wires the DOM node for the catalog block (below VIN/placa cards). */
  registerCatalogNavAnchorImpl: (fn: ((el: HTMLElement | null) => void) | null) => void;
  /** Called by hubs to attach the scroll target element. */
  registerCatalogNavAnchor: (el: HTMLElement | null) => void;
  /** Scroll so the catalog nav / hub block is in view (after category load, etc.). */
  scrollCatalogNavIntoView: () => void;
  registerScrollCatalogNavIntoView: (fn: (() => void) | null) => void;
  /** Desktop split: catalog dock uses a dim overlay; true after user focuses the search column. */
  leftPaneInlineDimSuppressed: boolean;
  suppressLeftPaneCatalogInlineDim: () => void;
  restoreCatalogInlineDim: () => void;
};

const CatalogDockContext = createContext<CatalogDockContextValue | null>(null);

export function CatalogDockProvider({ children }: { children: ReactNode }) {
  const [leftPaneDockNode, setLeftPaneDockNodeState] = useState<HTMLElement | null>(null);
  const setLeftPaneDockNode = useCallback((el: HTMLElement | null) => {
    setLeftPaneDockNodeState(el);
  }, []);

  const scrollResultsPanelFnRef = useRef<(() => void) | null>(null);
  const registerScrollResultsPanelToTop = useCallback((fn: (() => void) | null) => {
    scrollResultsPanelFnRef.current = fn;
  }, []);
  const scrollResultsPanelToTop = useCallback(() => {
    scrollResultsPanelFnRef.current?.();
  }, []);

  const registerCatalogNavAnchorImplRef = useRef<((el: HTMLElement | null) => void) | null>(null);
  const registerCatalogNavAnchorImpl = useCallback((fn: ((el: HTMLElement | null) => void) | null) => {
    registerCatalogNavAnchorImplRef.current = fn;
  }, []);
  const registerCatalogNavAnchor = useCallback((el: HTMLElement | null) => {
    registerCatalogNavAnchorImplRef.current?.(el);
  }, []);

  const scrollCatalogNavFnRef = useRef<(() => void) | null>(null);
  const registerScrollCatalogNavIntoView = useCallback((fn: (() => void) | null) => {
    scrollCatalogNavFnRef.current = fn;
  }, []);
  const scrollCatalogNavIntoView = useCallback(() => {
    scrollCatalogNavFnRef.current?.();
  }, []);

  const [leftPaneInlineDimSuppressed, setLeftPaneInlineDimSuppressed] = useState(false);
  const suppressLeftPaneCatalogInlineDim = useCallback(() => {
    setLeftPaneInlineDimSuppressed(true);
  }, []);
  const restoreCatalogInlineDim = useCallback(() => {
    setLeftPaneInlineDimSuppressed(false);
  }, []);

  const value = useMemo(
    () => ({
      leftPaneDockNode,
      setLeftPaneDockNode,
      scrollResultsPanelToTop,
      registerScrollResultsPanelToTop,
      registerCatalogNavAnchorImpl,
      registerCatalogNavAnchor,
      scrollCatalogNavIntoView,
      registerScrollCatalogNavIntoView,
      leftPaneInlineDimSuppressed,
      suppressLeftPaneCatalogInlineDim,
      restoreCatalogInlineDim,
    }),
    [
      leftPaneDockNode,
      setLeftPaneDockNode,
      scrollResultsPanelToTop,
      registerScrollResultsPanelToTop,
      registerCatalogNavAnchorImpl,
      registerCatalogNavAnchor,
      scrollCatalogNavIntoView,
      registerScrollCatalogNavIntoView,
      leftPaneInlineDimSuppressed,
      suppressLeftPaneCatalogInlineDim,
      restoreCatalogInlineDim,
    ],
  );

  return <CatalogDockContext.Provider value={value}>{children}</CatalogDockContext.Provider>;
}

export function useCatalogDockContext(): CatalogDockContextValue | null {
  return useContext(CatalogDockContext);
}
