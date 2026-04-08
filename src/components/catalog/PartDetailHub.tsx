import { useEffect, useRef, useState } from "react";
import { useCatalogDockContext } from "../../contexts/CatalogDockContext";
import type { PartResult } from "../../types";
import type { MenuItem } from "../../constants/remusaMenu";
import { PART_DETAIL_LOADING_MESSAGES, type PartDetailLoadingKey } from "../../constants/catalogLoadingMessages";
import PartDetailFloatingDock from "./PartDetailFloatingDock";
import TerminalLoader from "../search/TerminalLoader";
import * as api from "../../lib/remusaApi";
import { PartMedia } from "./PartMedia";

export default function PartDetailHub({ parts }: { parts: PartResult[] }) {
  const [ix, setIx] = useState(0);
  const [panel, setPanel] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loadingKey, setLoadingKey] = useState<PartDetailLoadingKey | null>(null);
  const [payload, setPayload] = useState<unknown>(null);

  const dockCtx = useCatalogDockContext();
  const scrollResultsPanelToTop = dockCtx?.scrollResultsPanelToTop;
  const prevLoadingKeyRef = useRef<PartDetailLoadingKey | null>(null);
  useEffect(() => {
    if (prevLoadingKeyRef.current != null && loadingKey == null) {
      scrollResultsPanelToTop?.();
    }
    prevLoadingKeyRef.current = loadingKey;
  }, [loadingKey, scrollResultsPanelToTop]);

  const p = parts[ix];
  if (!p) return null;

  const run = async (fn: () => Promise<unknown>, key: PartDetailLoadingKey) => {
    setLoadingKey(key);
    setErr(null);
    try {
      setPayload(await fn());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
      setPayload(null);
    } finally {
      setLoadingKey(null);
    }
  };

  const onMenuSelect = (item: MenuItem) => {
    setErr(null);
    if (item.id === "b") {
      setPanel(null);
      setPayload(null);
      return;
    }
    if (panel === item.id && payload !== null) {
      return;
    }
    if (panel !== item.id) {
      setPayload(null);
    }
    setPanel(item.id);
    const pn = p.partNumber;
    const epc = p.epc || "toyota";

    if (item.id === "t") {
      void run(() => api.tecdocPartLookup(pn), "t");
    } else if (item.id === "1") {
      void run(() => api.partsSearchExact(pn), "1");
    } else if (item.id === "2") {
      void run(() => api.partsInterchange(pn).then((r) => r.data), "2");
    } else if (item.id === "3") {
      void run(() => api.partsVehicles(pn).then((r) => r.data), "3");
    } else if (item.id === "4") {
      void run(() => api.partsVehiclesAftermarket(pn).then((r) => r.data), "4");
    } else if (item.id === "5") {
      void run(() => api.partsPrice(pn).then((r) => r.prices), "5");
    } else if (item.id === "6") {
      void run(() => api.partsIllustration({ epc, part_number: pn }), "6");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {parts.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {parts.map((x, i) => (
            <button
              key={x.partNumber + i}
              type="button"
              onClick={() => {
                setIx(i);
                setPanel(null);
                setPayload(null);
              }}
              className={`rounded-full border px-3 py-1.5 font-mono text-[11px] ${
                i === ix ? "border-[#75141C] bg-[#75141C]/10 text-[#75141C]" : "border-neutral-200"
              }`}
            >
              {x.partNumber}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-3">
        {p.partImg ? (
          <img
            src={p.partImg}
            alt={p.partNameEn}
            className="h-24 w-24 shrink-0 rounded-xl object-cover"
          />
        ) : null}
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold text-neutral-900">{p.partNumber}</p>
          <p className="text-[11px] text-neutral-600">{p.partNameEn}</p>
        </div>
      </div>

      <PartDetailFloatingDock onSelect={onMenuSelect} activePanelId={panel} />

      {loadingKey && panel && (
        <TerminalLoader
          messages={[...PART_DETAIL_LOADING_MESSAGES[loadingKey]]}
          active
          variant="light"
        />
      )}
      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 font-mono text-xs text-red-800">
          {err}
        </div>
      )}

      {panel && payload != null && (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-900 p-3">
          <p className="mb-2 font-mono text-[10px] text-emerald-400/90">{` > resultado (${panel})`}</p>
          {panel === "6" && typeof payload === "object" && payload !== null ? (
            <IllustrationPayload epc={p.epc} data={payload as Record<string, unknown>} />
          ) : (
            <pre className="wrap-break-word overflow-x-auto font-mono text-[10px] leading-relaxed text-emerald-100 whitespace-pre-wrap">
              {JSON.stringify(payload, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function IllustrationPayload({ epc, data }: { epc: string; data: Record<string, unknown> }) {
  const d = data.data as Record<string, unknown> | undefined;
  const img =
    (d?.imgaddress as string) ||
    (d?.imgAddress as string) ||
    (data.imgaddress as string) ||
    "";
  const url = api.diagramUrl(epc, img || undefined);
  return (
    <div className="space-y-2">
      {url ? (
        <PartMedia src={url} alt="Ilustración" className="max-h-64 w-full object-contain" />
      ) : null}
      <pre className="wrap-break-word overflow-x-auto font-mono text-[10px] leading-relaxed text-emerald-100 whitespace-pre-wrap">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
