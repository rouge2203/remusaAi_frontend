import { motion } from 'framer-motion'
import { HiOutlineTruck } from 'react-icons/hi2'
import type { VehicleInfo } from '../../types'
import InfoRow from './InfoRow'

interface VehicleInfoCardProps {
  vehicle: VehicleInfo;
  index: number;
}

export default function VehicleInfoCard({ vehicle, index }: VehicleInfoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.1 }}
      className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden"
    >
      {vehicle.imageUrl && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={vehicle.imageUrl}
            alt={vehicle.carModel}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-transparent to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="text-base font-bold text-white drop-shadow-lg">
              {vehicle.carMake} {vehicle.carModel}
            </h3>
            <p className="text-xs text-white/70 mt-0.5">{vehicle.registrationYear} &middot; {vehicle.colour}</p>
          </div>
        </div>
      )}

      <div className="p-4">
        {!vehicle.imageUrl && (
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-accent-orange/10 flex items-center justify-center">
              <HiOutlineTruck className="text-xl text-accent-orange" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">{vehicle.carMake} {vehicle.carModel}</h3>
              <p className="text-xs text-text-secondary">{vehicle.registrationYear}</p>
            </div>
          </div>
        )}

        <InfoRow label="VIN" value={vehicle.vin} highlight />
        <InfoRow label="Motor" value={`${vehicle.engineCode} - ${vehicle.engineSize}`} />
        <InfoRow label="Combustible" value={vehicle.fuel} />
        <InfoRow label="Carrocería" value={vehicle.body} />
        <InfoRow label="Tracción" value={vehicle.wheelPlan} />
        {vehicle.owner && <InfoRow label="Estado" value={vehicle.owner} />}
      </div>
    </motion.div>
  );
}
