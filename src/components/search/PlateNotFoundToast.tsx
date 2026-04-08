import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { HiXMark } from "react-icons/hi2";

const MESSAGE = "No se encontró información para esta placa.";

export default function PlateNotFoundToast({
  show,
  onDismiss,
}: {
  show: boolean;
  onDismiss: () => void;
}) {
  return createPortal(
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-0 z-70 flex items-end justify-center px-4 py-6 sm:items-start sm:justify-end sm:p-6"
    >
      <AnimatePresence>
        {show ? (
          <motion.div
            key="plate-not-found-toast"
            initial={{ opacity: 0, y: 16, x: 0 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.12 } }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="pointer-events-auto w-full max-w-sm"
          >
            <div className="rounded-xl border border-red-200/90 bg-white shadow-lg outline outline-black/5">
              <div className="flex items-start gap-3 p-4">
                <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-red-900">
                  {MESSAGE}
                </p>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="shrink-0 rounded-md p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#75141C]/40"
                  aria-label="Cerrar"
                >
                  <HiXMark className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
