import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TerminalLoaderProps {
  messages: string[];
  active: boolean;
}

export default function TerminalLoader({ messages, active }: TerminalLoaderProps) {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);

  useEffect(() => {
    if (!active) {
      setVisibleLines([]);
      return;
    }

    setVisibleLines([]);
    let current = 0;

    const interval = setInterval(() => {
      if (current < messages.length) {
        setVisibleLines(prev => [...prev, messages[current]]);
        current++;
      }
    }, 800);

    return () => clearInterval(interval);
  }, [active, messages]);

  if (!active) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="mt-3 rounded-xl bg-[#0D1117] border border-[#1B2430] p-3 font-mono text-xs overflow-hidden"
    >
      <AnimatePresence>
        {visibleLines.map((line, i) => (
          <motion.div
            key={`${line}-${i}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex items-center gap-2 py-0.5"
          >
            <span className="text-accent-green">{'>'}</span>
            <span className="text-accent-green/80">{line}</span>
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="flex items-center gap-2 py-0.5 mt-0.5">
        <span className="text-accent-green">{'>'}</span>
        <span className="animate-blink text-accent-green">_</span>
      </div>
    </motion.div>
  );
}
