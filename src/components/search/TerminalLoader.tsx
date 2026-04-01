import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TerminalLoaderProps {
  messages: string[];
  active: boolean;
  /** light = on white card (neutral). dark = on colored/dark panels. */
  variant?: 'light' | 'dark';
}

export default function TerminalLoader({ messages, active, variant = 'dark' }: TerminalLoaderProps) {
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
    }, 700);

    return () => clearInterval(interval);
  }, [active, messages]);

  if (!active) return null;

  const shell =
    variant === 'light'
      ? 'mt-3 rounded-2xl border border-neutral-200 bg-neutral-100/90 p-3 font-mono text-[11px] leading-relaxed text-neutral-600 shadow-inner'
      : 'mt-3 rounded-2xl border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-neutral-300 shadow-inner';

  const prompt = variant === 'light' ? 'text-neutral-400' : 'text-white/35';
  const lineText = variant === 'light' ? 'text-neutral-700' : 'text-neutral-200';
  const cursor = variant === 'light' ? 'text-neutral-500' : 'text-white/50';

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={`${shell} overflow-hidden`}
    >
      <AnimatePresence>
        {visibleLines.map((line, i) => (
          <motion.div
            key={`${line}-${i}`}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex items-start gap-2 py-0.5"
          >
            <span className={prompt}>{'›'}</span>
            <span className={lineText}>{line}</span>
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="flex items-center gap-2 py-0.5 mt-0.5">
        <span className={prompt}>{'›'}</span>
        <span className={`animate-blink ${cursor}`}>_</span>
      </div>
    </motion.div>
  );
}
