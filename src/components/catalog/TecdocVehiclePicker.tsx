import type { TecdocVehicleOption } from "../../types";

export default function TecdocVehiclePicker({
  options,
  onSelect,
}: {
  options: TecdocVehicleOption[];
  onSelect: (o: TecdocVehicleOption) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="rounded-2xl border border-amber-200/90 bg-amber-50/90 p-3 shadow-sm">
      <p className="mb-2 px-1 font-mono text-[10px] font-medium uppercase tracking-widest text-amber-800/90">
        {"> TecDoc: elige variante"}
      </p>
      <ul className="flex flex-col gap-1.5">
        {options.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              onClick={() => onSelect(o)}
              className="min-h-[48px] w-full rounded-xl border border-amber-200/80 bg-white/90 px-3 py-3 text-left font-mono text-sm text-neutral-900 transition-colors hover:border-amber-400/60 hover:bg-white"
            >
              <span className="text-amber-700/70">{"> "}</span>
              {o.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
