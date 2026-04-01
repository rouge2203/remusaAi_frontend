import { motion } from 'framer-motion'
import { HiOutlineWrenchScrewdriver, HiOutlineCheckBadge } from 'react-icons/hi2'
import type { PartResult } from '../../types'
import InfoRow from './InfoRow'

interface PartCardProps {
  part: PartResult;
  index: number;
}

export default function PartCard({ part, index }: PartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.1 }}
      className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden"
    >
      {part.partImg && (
        <div className="relative h-36 overflow-hidden">
          <img
            src={part.partImg}
            alt={part.partNameEn}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-transparent to-transparent" />
          {part.remusaMatch && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-accent-green/20 backdrop-blur-sm text-accent-green text-xs font-semibold px-2.5 py-1 rounded-full border border-accent-green/30">
              <HiOutlineCheckBadge className="text-sm" />
              REMUSA
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        {!part.partImg && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-orange/10 flex items-center justify-center">
                <HiOutlineWrenchScrewdriver className="text-xl text-accent-orange" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">{part.partNameEn}</h3>
                <p className="text-xs text-text-secondary">{part.partNameZh}</p>
              </div>
            </div>
            {part.remusaMatch && (
              <div className="flex items-center gap-1 bg-accent-green/20 text-accent-green text-xs font-semibold px-2.5 py-1 rounded-full border border-accent-green/30">
                <HiOutlineCheckBadge className="text-sm" />
                REMUSA
              </div>
            )}
          </div>
        )}

        {part.partImg && (
          <div className="mb-2">
            <h3 className="text-sm font-bold text-text-primary">{part.partNameEn}</h3>
            <p className="text-xs text-text-secondary">{part.partNameZh}</p>
          </div>
        )}

        <InfoRow label="Número" value={part.partNumber} highlight />
        <InfoRow label="Marca" value={part.brandNameEn} />
        <InfoRow label="EPC" value={part.epc.toUpperCase()} />
      </div>
    </motion.div>
  );
}
