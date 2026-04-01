interface InfoRowProps {
  label: string;
  value: string;
  highlight?: boolean;
  /** dark = rows on charcoal blocks (default). light = rows on white card. */
  surface?: 'dark' | 'light';
}

export default function InfoRow({ label, value, highlight = false, surface = 'dark' }: InfoRowProps) {
  if (surface === 'light') {
    return (
      <div className="flex justify-between items-baseline gap-3 py-2.5 border-b border-neutral-200 last:border-b-0">
        <span className="text-xs text-neutral-500 font-medium shrink-0">{label}</span>
        <span
          className={`text-xs font-semibold text-right ${highlight ? 'text-[#75141C]' : 'text-neutral-900'}`}
        >
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-baseline gap-3 py-2.5 border-b border-white/[0.06] last:border-b-0">
      <span className="text-xs text-neutral-400 font-medium shrink-0">{label}</span>
      <span
        className={`text-xs font-semibold text-right ${highlight ? 'text-[#e8a0a8]' : 'text-white'}`}
      >
        {value}
      </span>
    </div>
  );
}
