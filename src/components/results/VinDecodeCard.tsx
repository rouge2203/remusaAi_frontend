import { motion } from 'framer-motion'
import { HiOutlineFingerPrint } from 'react-icons/hi2'
import type { VinDecodeResult } from '../../types'
import InfoRow from './InfoRow'

interface VinDecodeCardProps {
  vinDecode: VinDecodeResult;
  index: number;
}

export default function VinDecodeCard({ vinDecode, index }: VinDecodeCardProps) {
  const model = vinDecode.models[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.1 }}
      className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center">
            <HiOutlineFingerPrint className="text-xl text-accent-blue" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Decodificación VIN</h3>
            <p className="text-xs text-text-secondary">{vinDecode.matchingMode}</p>
          </div>
        </div>

        <InfoRow label="EPC" value={vinDecode.epc.toUpperCase()} highlight />
        <InfoRow label="Marca" value={vinDecode.brand} />
        <InfoRow label="Año Modelo" value={vinDecode.modelYear} />
        <InfoRow label="Fabricación" value={vinDecode.buildDate} />
        <InfoRow label="País" value={vinDecode.madeIn} />

        {model && (
          <>
            <div className="mt-3 mb-2 pt-3 border-t border-white/5">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Modelo Identificado
              </span>
            </div>
            <InfoRow label="Modelo" value={model.model} />
            <InfoRow label="Motor" value={model.engine} />
            <InfoRow label="Cilindrada" value={`${model.cc} cc`} />
            <InfoRow label="Transmisión" value={model.transmission} />
            <InfoRow label="Tracción" value={model.drive} />
            <InfoRow label="Serie" value={model.series} />
            <InfoRow label="Planta" value={model.factory} />
          </>
        )}
      </div>
    </motion.div>
  );
}
