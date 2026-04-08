import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { HiXMark } from "react-icons/hi2";

export default function DiagramLightbox({
  open,
  onClose,
  src,
  alt,
}: {
  open: boolean;
  onClose: () => void;
  src: string;
  alt: string;
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="epc-diagram-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/88 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="relative flex max-h-[min(92dvh,920px)] w-full max-w-[min(96vw,1200px)] flex-col items-center justify-center"
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute -right-1 -top-1 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-neutral-900/90 text-white shadow-lg backdrop-blur-sm transition hover:bg-neutral-800 sm:right-0 sm:top-0"
              aria-label="Cerrar"
            >
              <HiXMark className="h-6 w-6" />
            </button>
            <img
              src={src}
              alt={alt}
              className="max-h-[min(88dvh,880px)] w-full object-contain"
              decoding="async"
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
