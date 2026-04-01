import { useState } from 'react'
import { motion } from 'framer-motion'
import { HiOutlineMagnifyingGlass } from 'react-icons/hi2'

interface SearchInputProps {
  placeholder: string;
  onSearch: (value: string) => void;
  loading: boolean;
}

export default function SearchInput({ placeholder, onSearch, loading }: SearchInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !loading) {
      onSearch(value.trim());
    }
  };

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
        className="flex-1 bg-bg-primary border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors duration-300 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="px-4 py-2.5 bg-accent-orange text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-200 hover:brightness-110 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:hover:brightness-100"
      >
        <HiOutlineMagnifyingGlass className="text-base" />
        <span>Buscar</span>
      </button>
    </motion.form>
  );
}
