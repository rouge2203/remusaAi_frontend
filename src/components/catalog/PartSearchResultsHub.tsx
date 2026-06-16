import { useMemo, useState } from "react";
import { HiOutlineArchiveBox } from "react-icons/hi2";
import type { PartResult, RemusaHit } from "../../types";
import PartSearchDetailSheet from "./PartSearchDetailSheet";
import CollapsibleResultCard from "../results/CollapsibleResultCard";

interface Props {
  parts: PartResult[];
  remusaMap: Record<string, RemusaHit>;
  directRemusaList: RemusaHit[];
}

/** Muted pill marking a REMUSA article whose ACTIVO flag is false. */
function InactiveBadge() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-neutral-300 bg-neutral-100 px-2 py-px text-[9px] font-semibold uppercase tracking-wide text-neutral-600">
      Inactivo
    </span>
  );
}

export default function PartSearchResultsHub({ parts, remusaMap, directRemusaList }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetPart, setSheetPart] = useState<PartResult | null>(null);
  const [sheetRemusa, setSheetRemusa] = useState<RemusaHit | null>(null);
  const [directOnly, setDirectOnly] = useState(false);

  const openSheet = (part: PartResult, hit: RemusaHit | null) => {
    setSheetPart(part);
    setSheetRemusa(hit);
    setDirectOnly(false);
    setSheetOpen(true);
  };

  const openDirectRemusaSheet = (hit: RemusaHit) => {
    setSheetPart(null);
    setSheetRemusa(hit);
    setDirectOnly(true);
    setSheetOpen(true);
  };

  // ── Active / inactive partition ─────────────────────────────────────────
  // A 17VIN part is "inactive" only when its REMUSA match is inactive; an
  // unmatched part (or one matched to an active article) stays active. A
  // missing flag is treated as active so nothing is hidden by accident.
  const activeParts = useMemo(
    () => parts.filter((p) => remusaMap[p.partNumber]?.activo !== false),
    [parts, remusaMap],
  );
  const inactiveParts = useMemo(
    () => parts.filter((p) => remusaMap[p.partNumber]?.activo === false),
    [parts, remusaMap],
  );

  const sortedActiveParts = useMemo(() => {
    return [...activeParts].sort((a, b) => {
      const aHit = remusaMap[a.partNumber] ? 1 : 0;
      const bHit = remusaMap[b.partNumber] ? 1 : 0;
      return bHit - aHit;
    });
  }, [activeParts, remusaMap]);

  const remusaMatchCount = useMemo(
    () => activeParts.filter((p) => remusaMap[p.partNumber]).length,
    [activeParts, remusaMap],
  );

  // Direct REMUSA hits not already shown as a matched 17VIN part row (active
  // or inactive), so an articulo is never displayed twice.
  const extraRemusa = useMemo(() => {
    const shownArticulos = new Set(
      parts.map((p) => remusaMap[p.partNumber]?.articulo).filter(Boolean),
    );
    return directRemusaList.filter((h) => !shownArticulos.has(h.articulo));
  }, [parts, remusaMap, directRemusaList]);

  const activeExtra = useMemo(() => extraRemusa.filter((h) => h.activo !== false), [extraRemusa]);
  const inactiveExtra = useMemo(() => extraRemusa.filter((h) => h.activo === false), [extraRemusa]);

  const inactiveCount = inactiveParts.length + inactiveExtra.length;
  const hasDirectOnly = parts.length === 0;

  // 17VIN part row (also used inside the inactive section for inactive-matched
  // parts). The "Inactivo" badge renders only when the REMUSA match is inactive.
  const renderPartCard = (p: PartResult, i: number) => {
    const hit = remusaMap[p.partNumber] ?? null;
    const inactive = hit?.activo === false;
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
              <p className="mt-0.5 flex items-center gap-2 font-mono text-[11px] font-semibold text-[#75141C]">
                <span className="min-w-0 truncate">
                  {hit.articulo}
                  <span className="font-normal text-neutral-500"> · {hit.source}</span>
                </span>
                {inactive ? <InactiveBadge /> : null}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  // Direct REMUSA article card (code/description hit with no 17VIN part row).
  const renderDirectCard = (hit: RemusaHit, i: number) => {
    const inactive = hit.activo === false;
    return (
      <div
        key={`${hit.articulo}-${i}`}
        role="button"
        tabIndex={0}
        onClick={() => openDirectRemusaSheet(hit)}
        onKeyDown={(ev) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            openDirectRemusaSheet(hit);
          }
        }}
        className="cursor-pointer rounded-xl border border-neutral-200/80 bg-white p-3 shadow-sm ring-1 ring-[#75141C]/12 transition-[box-shadow,border-color] hover:border-neutral-300/90 hover:shadow-md"
      >
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-mono text-[12px] font-semibold leading-snug text-neutral-900">
            <span className="min-w-0 truncate">
              <span className="text-[#75141C]">★ </span>
              {hit.articulo}
            </span>
            {inactive ? <InactiveBadge /> : null}
          </p>
          {hit.desc ? (
            <p className="font-mono text-[12px] font-semibold leading-snug text-neutral-900 mt-0.5">
              {hit.desc}
            </p>
          ) : null}
          <div className="mt-2.5 border-t border-neutral-100 pt-2.5">
            <p className="font-mono text-[10px] font-medium uppercase tracking-wide text-neutral-400">
              Código REMUSA
            </p>
            <p className="mt-0.5 font-mono text-[11px] font-semibold text-[#75141C]">
              {hit.articulo}
              <span className="font-normal text-neutral-500"> · {hit.source}</span>
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]">
        <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          Resultados de búsqueda
        </p>

        {hasDirectOnly ? (
          activeExtra.length > 0 ? (
            <>
              <p className="mt-2 font-mono text-[11px] font-medium text-[#75141C]">
                {activeExtra.length === 1
                  ? "No encontrado en catálogo 17VIN — encontrado en REMUSA"
                  : `No encontrado en catálogo 17VIN — ${activeExtra.length} coincidencias en REMUSA`}
              </p>
              <div className="mt-3 space-y-3 border-t border-neutral-100 pt-3">
                {activeExtra.map((hit, i) => renderDirectCard(hit, i))}
              </div>
            </>
          ) : (
            <p className="mt-2 font-mono text-[11px] font-medium text-[#75141C]">
              No encontrado en catálogo 17VIN — sin coincidencias activas en REMUSA
            </p>
          )
        ) : (
          <>
            {remusaMatchCount > 0 ? (
              <p className="mt-2 font-mono text-[11px] font-medium text-[#75141C]">
                {remusaMatchCount} / {activeParts.length} · {((remusaMatchCount / activeParts.length) * 100).toFixed(1)}% en REMUSA
              </p>
            ) : (
              <p className="mt-2 font-mono text-[11px] text-neutral-500">
                Ninguna parte activa en REMUSA.
              </p>
            )}

            <div className="mt-3 space-y-3 border-t border-neutral-100 pt-3">
              {sortedActiveParts.map((p, i) => renderPartCard(p, i))}
            </div>

            {activeExtra.length > 0 ? (
              <>
                <p className="mt-4 font-mono text-[11px] font-medium text-[#75141C]">
                  {activeExtra.length === 1
                    ? "También en REMUSA (por descripción)"
                    : `También en REMUSA (por descripción) — ${activeExtra.length} coincidencias`}
                </p>
                <div className="mt-3 space-y-3 border-t border-neutral-100 pt-3">
                  {activeExtra.map((hit, i) => renderDirectCard(hit, i))}
                </div>
              </>
            ) : null}
          </>
        )}
      </div>

      {inactiveCount > 0 ? (
        <CollapsibleResultCard
          title="Artículos Inactivos"
          subtitle={inactiveCount === 1 ? "1 artículo inactivo" : `${inactiveCount} artículos inactivos`}
          icon={<HiOutlineArchiveBox className="text-2xl" />}
          defaultOpen={false}
          className="mt-3"
        >
          <div className="space-y-3">
            {inactiveParts.map((p, i) => renderPartCard(p, i))}
            {inactiveExtra.map((hit, i) => renderDirectCard(hit, i))}
          </div>
        </CollapsibleResultCard>
      ) : null}

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
