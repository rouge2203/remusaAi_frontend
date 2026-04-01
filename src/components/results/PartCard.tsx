import { motion } from "framer-motion";
import { HiOutlineWrenchScrewdriver, HiOutlineCheckBadge } from "react-icons/hi2";
import type { PartResult } from "../../types";
import InfoRow from "./InfoRow";
import CollapsibleResultCard from "./CollapsibleResultCard";

interface PartCardProps {
  part: PartResult;
  index: number;
}

export default function PartCard({ part, index }: PartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: index * 0.05 }}
    >
      <CollapsibleResultCard
        defaultOpen
        title={part.partNameEn || "Pieza"}
        subtitle={`${part.partNumber} · ${part.brandNameEn}`}
        icon={<HiOutlineWrenchScrewdriver className="text-2xl" strokeWidth={1.5} />}
        meta={
          part.remusaMatch ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800">
              <HiOutlineCheckBadge className="text-sm" />
              REMUSA
            </span>
          ) : (
            <span className="text-neutral-400">{part.partNameZh}</span>
          )
        }
      >
        <div className="space-y-3">
          {part.partImg && (
            <div className="relative overflow-hidden rounded-xl border border-neutral-200/80 bg-neutral-100">
              <img
                src={part.partImg}
                alt={part.partNameEn}
                className="h-44 w-full object-cover"
              />
              {part.remusaMatch && (
                <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full border border-emerald-200 bg-white/95 px-2 py-1 text-[11px] font-semibold text-emerald-800 shadow-sm">
                  <HiOutlineCheckBadge className="text-sm" />
                  REMUSA
                </div>
              )}
            </div>
          )}

          <div className="rounded-xl border border-neutral-200/80 bg-white p-3 shadow-sm">
            <InfoRow label="Número" value={part.partNumber} highlight surface="light" />
            <InfoRow label="Marca" value={part.brandNameEn} surface="light" />
            <InfoRow label="EPC" value={part.epc.toUpperCase()} surface="light" />
          </div>
        </div>
      </CollapsibleResultCard>
    </motion.div>
  );
}
