import { useState } from 'react'
import { motion } from 'framer-motion'
import { HiOutlineMagnifyingGlass } from 'react-icons/hi2'

interface SearchInputProps {
  placeholder: string;
  onSearch: (value: string) => void;
  loading: boolean;
  /** Dark = on charcoal (default). Light = on white card. */
  variant?: 'dark' | 'light';
}

export default function SearchInput({ placeholder, onSearch, loading, variant = 'dark' }: SearchInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !loading) {
      onSearch(value.trim());
    }
  };

  const inputClass =
    variant === 'light'
      ? 'flex-1 bg-neutral-100 border border-neutral-200 rounded-2xl px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#75141C] focus:ring-2 focus:ring-[#75141C]/15 transition-all duration-300 disabled:opacity-50'
      : 'flex-1 bg-black/45 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-accent-orange/25 transition-all duration-300 disabled:opacity-50';

  const buttonClass =
    variant === 'light'
      ? 'px-4 py-2.5 bg-[#75141C] text-white rounded-2xl text-sm font-semibold flex items-center gap-2 shadow-md transition-all duration-300 hover:bg-[#5c1018] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40'
      : 'px-4 py-2.5 bg-gradient-to-b from-[#8f2330] to-[#75141C] text-white rounded-2xl text-sm font-semibold flex items-center gap-2 shadow-[0_8px_20px_-10px_rgba(117,20,28,0.55)] transition-all duration-300 hover:brightness-110 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:hover:brightness-100';

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut', delay: 0.1 }}
      className="flex gap-2 mt-3"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={loading}
        className={inputClass}
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className={buttonClass}
      >
        <HiOutlineMagnifyingGlass className="text-base" />
        <span>Buscar</span>
      </button>
    </motion.form>
  );
}
