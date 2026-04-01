import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiChevronDown } from "react-icons/hi2";

const expand = {
  height: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
  opacity: { duration: 0.2 },
};

interface CollapsibleResultCardProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  /** Skills-style meta line under subtitle (e.g. badges) */
  meta?: ReactNode;
  children: ReactNode;
  /** Open by default; tap header to collapse */
  defaultOpen?: boolean;
  className?: string;
}

export default function CollapsibleResultCard({
  title,
  subtitle,
  icon,
  meta,
  children,
  defaultOpen = true,
  className = "",
}: CollapsibleResultCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`rounded-2xl border border-neutral-200/90 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] overflow-hidden ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-neutral-50/80"
        aria-expanded={open}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold leading-tight tracking-tight text-neutral-900">{title}</p>
          <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>
          {meta ? <div className="mt-2 text-xs text-neutral-500">{meta}</div> : null}
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="mt-1 shrink-0 text-neutral-400"
        >
          <HiChevronDown className="text-xl" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={expand}
            className="overflow-hidden border-t border-neutral-100"
          >
            <div className="bg-neutral-50/80 px-4 py-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
