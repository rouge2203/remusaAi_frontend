interface InfoRowProps {
  label: string;
  value: string;
  highlight?: boolean;
}

export default function InfoRow({ label, value, highlight = false }: InfoRowProps) {
  return (
    <div className="flex justify-between items-baseline py-1.5 border-b border-white/5 last:border-b-0">
      <span className="text-xs text-text-secondary font-medium">{label}</span>
      <span className={`text-xs font-semibold text-right ml-4 ${highlight ? 'text-accent-orange' : 'text-text-primary'}`}>
        {value}
      </span>
    </div>
  );
}
