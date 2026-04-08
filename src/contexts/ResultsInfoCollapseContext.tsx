import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ResultsInfoCollapseContextValue = {
  collapseTick: number;
  expandTick: number;
  triggerInfoCardsCollapse: () => void;
  triggerInfoCardsExpand: () => void;
};

const ResultsInfoCollapseContext = createContext<ResultsInfoCollapseContextValue | null>(null);

export function ResultsInfoCollapseProvider({ children }: { children: ReactNode }) {
  const [collapseTick, setCollapseTick] = useState(0);
  const [expandTick, setExpandTick] = useState(0);
  const triggerInfoCardsCollapse = useCallback(() => {
    setCollapseTick((t) => t + 1);
  }, []);
  const triggerInfoCardsExpand = useCallback(() => {
    setExpandTick((t) => t + 1);
  }, []);

  const value = useMemo(
    () => ({
      collapseTick,
      expandTick,
      triggerInfoCardsCollapse,
      triggerInfoCardsExpand,
    }),
    [collapseTick, expandTick, triggerInfoCardsCollapse, triggerInfoCardsExpand],
  );

  return (
    <ResultsInfoCollapseContext.Provider value={value}>{children}</ResultsInfoCollapseContext.Provider>
  );
}

export function useResultsInfoCollapse(): ResultsInfoCollapseContextValue | null {
  return useContext(ResultsInfoCollapseContext);
}
