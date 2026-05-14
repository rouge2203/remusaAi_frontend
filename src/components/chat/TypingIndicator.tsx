import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RiRobot2Line } from "react-icons/ri";

const STAGES: { afterMs: number; label: string }[] = [
  { afterMs: 0, label: "Pensando" },
  { afterMs: 4000, label: "Consultando datos" },
  { afterMs: 10000, label: "Buscando en inventario REMUSA" },
  { afterMs: 20000, label: "Aún trabajando, casi listo" },
];

export default function TypingIndicator() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    setStage(0);
    const timers = STAGES.slice(1).map((s, i) =>
      setTimeout(() => setStage(i + 1), s.afterMs),
    );
    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
        <RiRobot2Line className="text-base" />
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-neutral-200/90 bg-white px-3.5 py-2.5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1">
            <span
              className="h-2 w-2 animate-bounce rounded-full bg-neutral-400"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="h-2 w-2 animate-bounce rounded-full bg-neutral-400"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="h-2 w-2 animate-bounce rounded-full bg-neutral-400"
              style={{ animationDelay: "300ms" }}
            />
          </div>
          <motion.span
            key={stage}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="font-mono text-[11px] text-neutral-500"
          >
            {STAGES[stage].label}…
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}
