import { motion } from "framer-motion";
import { HiOutlineFingerPrint } from "react-icons/hi2";
import type { VinDecodeResult } from "../../types";
import { useResultsInfoCollapse } from "../../contexts/ResultsInfoCollapseContext";
import { extractVinFactorySpecs } from "../../lib/extractVinFactorySpecs";
import InfoRow from "./InfoRow";
import CollapsibleResultCard from "./CollapsibleResultCard";

interface VinDecodeCardProps {
  vinDecode: VinDecodeResult;
  /** Raw 17VIN `data` (option codes / factory attrs). */
  decodeData?: Record<string, unknown> | null;
  index: number;
}

export default function VinDecodeCard({ vinDecode, decodeData, index }: VinDecodeCardProps) {
  const infoCollapse = useResultsInfoCollapse();
  const model = vinDecode.models[0];
  const isTecdoc = vinDecode.epc === "tecdoc";
  const factorySpecs = extractVinFactorySpecs(decodeData ?? null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: index * 0.05 }}
    >
      <CollapsibleResultCard
        defaultOpen
        collapseSignal={infoCollapse?.collapseTick ?? 0}
        expandSignal={infoCollapse?.expandTick ?? 0}
        title="Decodificación VIN"
        subtitle={`${vinDecode.brand} · ${vinDecode.epc.toUpperCase() || "EPC"}`}
        icon={<HiOutlineFingerPrint className="text-2xl" strokeWidth={1.5} />}
        meta={<span className="text-neutral-400">{vinDecode.matchingMode}</span>}
      >
        <div className="rounded-xl border border-neutral-200/80 bg-white p-3 shadow-sm space-y-0">
          <InfoRow label="EPC" value={vinDecode.epc.toUpperCase()} highlight surface="light" />
          {isTecdoc ? <InfoRow label="Marca" value={vinDecode.brand} surface="light" /> : null}
          {vinDecode.modelSpecification ? (
            <InfoRow label="Modelo" value={vinDecode.modelSpecification} surface="light" />
          ) : null}
          <InfoRow label="Año modelo" value={vinDecode.modelYear} surface="light" />
          <InfoRow label="Fabricación" value={vinDecode.buildDate} surface="light" />
          <InfoRow label="País" value={vinDecode.madeIn} surface="light" />
          {factorySpecs.map((row) => (
            <InfoRow key={row.label} label={row.label} value={row.value} surface="light" />
          ))}

          {model && (
            <>
              <div className="my-2 border-t border-neutral-200 pt-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  Modelo identificado
                </span>
              </div>
              <InfoRow label="Modelo" value={model.model} surface="light" />
              <InfoRow label="Motor" value={model.engine} surface="light" />
              <InfoRow label="Cilindrada" value={`${model.cc} cc`} surface="light" />
              <InfoRow label="Transmisión" value={model.transmission} surface="light" />
              <InfoRow label="Tracción" value={model.drive} surface="light" />
              <InfoRow label="Serie" value={model.series} surface="light" />
              <InfoRow label="Planta" value={model.factory} surface="light" />
            </>
          )}
        </div>
      </CollapsibleResultCard>
    </motion.div>
  );
}
