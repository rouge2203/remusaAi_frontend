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
    <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden transition-colors duration-200 hover:bg-bg-card-hover">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 transition-all duration-200 active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl text-accent-orange transition-transform duration-200">
            {icon}
          </span>
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
              height: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
              opacity: { duration: 0.25, ease: 'easeInOut' },
            }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
