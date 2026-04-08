import { useMemo, useState } from "react";
import type { PartResult, RemusaHit } from "../../types";
import PartSearchDetailSheet from "./PartSearchDetailSheet";

interface Props {
  parts: PartResult[];
  remusaMap: Record<string, RemusaHit>;
  directRemusa: RemusaHit | null;
}

export default function PartSearchResultsHub({ parts, remusaMap, directRemusa }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetPart, setSheetPart] = useState<PartResult | null>(null);
  const [sheetRemusa, setSheetRemusa] = useState<RemusaHit | null>(null);
  const [directOnly, setDirectOnly] = useState(false);

  const remusaMatchCount = useMemo(
    () => parts.filter((p) => remusaMap[p.partNumber]).length,
    [parts, remusaMap],
  );

  const sortedParts = useMemo(() => {
    return [...parts].sort((a, b) => {
      const aHit = remusaMap[a.partNumber] ? 1 : 0;
      const bHit = remusaMap[b.partNumber] ? 1 : 0;
      return bHit - aHit;
    });
  }, [parts, remusaMap]);

  const openSheet = (part: PartResult, hit: RemusaHit | null) => {
    setSheetPart(part);
    setSheetRemusa(hit);
    setDirectOnly(false);
    setSheetOpen(true);
  };

  const openDirectRemusaSheet = () => {
    setSheetPart(null);
    setSheetRemusa(directRemusa);
    setDirectOnly(true);
    setSheetOpen(true);
  };

  const hasDirectOnly = parts.length === 0 && directRemusa;

  return (
    <>
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]">
        <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          Resultados de búsqueda
        </p>

        {hasDirectOnly ? (
          <>
            <p className="mt-2 font-mono text-[11px] font-medium text-[#75141C]">
              No encontrado en catálogo 17VIN — encontrado en REMUSA
            </p>
            <div className="mt-3 space-y-3 border-t border-neutral-100 pt-3">
              <div
                role="button"
                tabIndex={0}
                onClick={openDirectRemusaSheet}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    openDirectRemusaSheet();
                  }
                }}
                className="cursor-pointer rounded-xl border border-neutral-200/80 bg-white p-3 shadow-sm ring-1 ring-[#75141C]/12 transition-[box-shadow,border-color] hover:border-neutral-300/90 hover:shadow-md"
              >
                <div className="min-w-0">
                  <p className="font-mono text-[12px] font-semibold leading-snug text-neutral-900">
                    <span className="text-[#75141C]">★ </span>
                    {directRemusa.articulo}
                  </p>
                  {directRemusa.desc ? (
                    <p className="font-mono text-[12px] font-semibold leading-snug text-neutral-900 mt-0.5">
                      {directRemusa.desc}
                    </p>
                  ) : null}
                  <div className="mt-2.5 border-t border-neutral-100 pt-2.5">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                      Código REMUSA
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] font-semibold text-[#75141C]">
                      {directRemusa.articulo}
                      <span className="font-normal text-neutral-500"> · {directRemusa.source}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {remusaMatchCount > 0 ? (
              <p className="mt-2 font-mono text-[11px] font-medium text-[#75141C]">
                {remusaMatchCount} / {parts.length} · {((remusaMatchCount / parts.length) * 100).toFixed(1)}% en REMUSA
              </p>
            ) : (
              <p className="mt-2 font-mono text-[11px] text-neutral-500">
                Ninguna parte en REMUSA.
              </p>
            )}

            <div className="mt-3 space-y-3 border-t border-neutral-100 pt-3">
              {sortedParts.map((p, i) => {
                const hit = remusaMap[p.partNumber] ?? null;
                return (
                  <div
                    key={`${p.partNumber}-${i}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => openSheet(p, hit)}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        openSheet(p, hit);
                      }
                    }}
                    className={`cursor-pointer rounded-xl border border-neutral-200/80 bg-white p-3 shadow-sm transition-[box-shadow,border-color] hover:border-neutral-300/90 hover:shadow-md ${
                      hit ? "ring-1 ring-[#75141C]/12" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-[12px] font-semibold leading-snug text-neutral-900">
                        {hit ? <span className="text-[#75141C]">★ </span> : null}
                        {p.partNumber}
                      </p>
                      {hit?.desc ? (
                        <p className="font-mono text-[12px] font-semibold leading-snug text-neutral-900 mt-0.5">
                          {hit.desc}
                        </p>
                      ) : null}
                      {p.partNameEn ? (
                        <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">{p.partNameEn}</p>
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
          </>
        )}
      </div>

      <PartSearchDetailSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        part={sheetPart}
        remusaHit={sheetRemusa}
        directOnly={directOnly}
      />
    </>
  );
}
