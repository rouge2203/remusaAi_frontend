import { motion, AnimatePresence } from 'framer-motion'
import { HiChevronDown } from 'react-icons/hi2'
import type { ReactNode } from 'react'

interface SearchBlockProps {
  title: string;
  icon: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export default function SearchBlock({ title, icon, isOpen, onToggle, children }: SearchBlockProps) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[#191a1b]/85 overflow-hidden shadow-[0_20px_40px_-34px_rgba(0,0,0,1)] transition-all duration-300 hover:bg-[#202122]/95">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 transition-all duration-200 active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl text-accent-orange transition-transform duration-300">
            {icon}
          </span>
          <span className="text-[22px] leading-none text-white/70">·</span>
          <span className="text-sm font-semibold text-text-primary">{title}</span>
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="text-text-secondary"
        >
          <HiChevronDown className="text-lg" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.3, ease: 'easeInOut' },
            }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-white/5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
