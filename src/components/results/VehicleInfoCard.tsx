import { useState } from "react";
import { motion } from "framer-motion";
import { HiArrowsPointingOut, HiOutlineTruck } from "react-icons/hi2";
import type { VehicleInfo } from "../../types";
import { useResultsInfoCollapse } from "../../contexts/ResultsInfoCollapseContext";
import InfoRow from "./InfoRow";
import CollapsibleResultCard from "./CollapsibleResultCard";
import DiagramLightbox from "../catalog/DiagramLightbox";

interface VehicleInfoCardProps {
  vehicle: VehicleInfo;
  index: number;
}

export default function VehicleInfoCard({ vehicle, index }: VehicleInfoCardProps) {
  const infoCollapse = useResultsInfoCollapse();
  const [imgOpen, setImgOpen] = useState(false);
  const title = `${vehicle.carMake} ${vehicle.carModel}`.trim();
  const subtitle = [vehicle.registrationYear, vehicle.colour].filter(Boolean).join(" · ");

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
        title={title || "Vehículo"}
        subtitle={subtitle || "Costa Rica"}
        icon={<HiOutlineTruck className="text-2xl" strokeWidth={1.5} />}
        meta={
          <span className="text-neutral-400">
            {vehicle.body && `${vehicle.body}`}
            {vehicle.body && vehicle.fuel ? " · " : ""}
            {vehicle.fuel && `${vehicle.fuel}`}
          </span>
        }
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-neutral-200/80 bg-white p-3 shadow-sm">
            <div className="flex gap-3 min-w-0">
              <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                {vehicle.imageUrl ? (
                  <img src={vehicle.imageUrl} alt={title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-neutral-400">
                    <HiOutlineTruck className="text-3xl" />
                  </div>
                )}
                {vehicle.imageUrl ? (
                  <button
                    type="button"
                    onClick={() => setImgOpen(true)}
                    className="absolute right-1 top-1 z-10 flex items-center gap-1 rounded-md border border-neutral-200/90 bg-white/95 px-1.5 py-1 font-mono text-[10px] font-medium text-neutral-800 shadow-sm backdrop-blur-sm transition hover:bg-white"
                    aria-label="Ver imagen ampliada"
                  >
                    <HiArrowsPointingOut className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Ver
                  </button>
                ) : null}
                {vehicle.engineSize && (
                  <span className="absolute bottom-1 left-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {vehicle.engineSize}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-semibold text-neutral-900">Registro vehicular</p>
                <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
                  Datos desde RegCheck CR. Revise VIN y motor antes de pedir partes.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200/80 bg-white p-3 shadow-sm">
            <InfoRow label="VIN" value={vehicle.vin} highlight surface="light" />
            <InfoRow label="Motor" value={`${vehicle.engineCode} — ${vehicle.engineSize}`} surface="light" />
            <InfoRow label="Combustible" value={vehicle.fuel} surface="light" />
            <InfoRow label="Carrocería" value={vehicle.body} surface="light" />
            <InfoRow label="Tracción" value={vehicle.wheelPlan} surface="light" />
            {vehicle.owner && <InfoRow label="Propietario" value={vehicle.owner} surface="light" />}
          </div>
        </div>
      </CollapsibleResultCard>
      {vehicle.imageUrl ? (
        <DiagramLightbox
          open={imgOpen}
          onClose={() => setImgOpen(false)}
          src={vehicle.imageUrl}
          alt={title}
        />
      ) : null}
    </motion.div>
  );
}
