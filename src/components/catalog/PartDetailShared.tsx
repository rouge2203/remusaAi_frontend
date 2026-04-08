import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HiChevronDown } from "react-icons/hi2";
import { translateZh } from "../../constants/zhBrandMap";

export const CARD =
  "rounded-2xl border border-neutral-200/90 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] overflow-hidden";

export function oeStr(p: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = p[k];
    if (v != null && String(v).trim() !== "") return String(v);
  }
  return "";
}

export function moneyCRC(n: number): string {
  return `₡ ${n.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function moneyUSD(n: number): string {
  return `$ ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-neutral-100 py-2.5 last:border-b-0">
      <span className="shrink-0 text-xs font-medium text-neutral-500">{label}</span>
      <span className={`text-right text-xs font-semibold ${highlight ? "text-[#75141C]" : "text-neutral-900"}`}>
        {value}
      </span>
    </div>
  );
}

export function SheetSection({
  title,
  collapseSignal,
  children,
}: {
  title: string;
  collapseSignal: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (collapseSignal) setOpen(false);
  }, [collapseSignal]);
  useEffect(() => {
    if (!collapseSignal) setOpen(true);
  }, [collapseSignal]);

  return (
    <div className={CARD}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[48px] w-full items-center justify-between gap-2 px-4 py-3.5 text-left transition-colors hover:bg-neutral-50/80"
        aria-expanded={open}
      >
        <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
          {title}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-neutral-400">
          <HiChevronDown className="text-xl" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: { duration: 0.28, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.2 } }}
            className="overflow-hidden border-t border-neutral-100"
          >
            <div className="bg-neutral-50/80 px-4 py-3">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function VehicleListView({
  vehicles,
  mode,
}: {
  vehicles: Array<Record<string, unknown>>;
  mode: "3" | "4";
}) {
  const [brandFilter, setBrandFilter] = useState<string | null>(null);

  const parsed = useMemo(() => {
    if (mode === "3") {
      return vehicles.map((m) => ({
        brand: translateZh(String(m.Brand ?? m.brand ?? "?")),
        model: translateZh(String(m.Model ?? m.model ?? "")),
        version: translateZh(String(m.Sales_version ?? m.sales_version ?? "")),
        cc: String(m.CC ?? m.Cc ?? m.cc ?? ""),
        engine: String(m.Engine_no ?? m.engine_no ?? ""),
        year: String(m.Model_year ?? m.model_year ?? ""),
        fuel: String(m.Fuel_type ?? m.fuel_type ?? ""),
        body: String(m.Body_type ?? m.body_type ?? ""),
        driven: String(m.Driven_model ?? m.driven_model ?? ""),
        begin: String(m.Date_begin ?? m.date_begin ?? ""),
        end: String(m.Date_end ?? m.date_end ?? ""),
      }));
    }
    return vehicles.map((m) => ({
      brand: translateZh(String(m.brand ?? m.Brand ?? "?")),
      model: translateZh(String(m.model ?? m.Model ?? "")),
      version: translateZh(String(m.series ?? m.Series ?? "")),
      cc: String(m.cc ?? m.CC ?? ""),
      engine: String(m.engine_nos ?? m.Engine_no ?? ""),
      year: String(m.model_years ?? m.Model_year ?? ""),
      fuel: "",
      body: "",
      driven: "",
      begin: "",
      end: "",
    }));
  }, [vehicles, mode]);

  const brands = useMemo(() => {
    const set = new Set(parsed.map((v) => v.brand));
    return Array.from(set).sort();
  }, [parsed]);

  const filtered = brandFilter ? parsed.filter((v) => v.brand === brandFilter) : parsed;

  return (
    <div className="space-y-3">
      {brands.length > 1 ? (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setBrandFilter(null)}
            className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
              !brandFilter
                ? "bg-[#75141C] text-white shadow-sm"
                : "border border-neutral-200/80 bg-white text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            Todos ({parsed.length})
          </button>
          {brands.map((b) => {
            const count = parsed.filter((v) => v.brand === b).length;
            return (
              <button
                key={b}
                type="button"
                onClick={() => setBrandFilter(brandFilter === b ? null : b)}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                  brandFilter === b
                    ? "bg-[#75141C] text-white shadow-sm"
                    : "border border-neutral-200/80 bg-white text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                {b} ({count})
              </button>
            );
          })}
        </div>
      ) : null}
      <p className="text-[11px] text-neutral-500">
        {filtered.length} vehículo{filtered.length === 1 ? "" : "s"}
        {brandFilter ? ` · ${brandFilter}` : ""}
      </p>
      <ul className="space-y-1.5">
        {filtered.map((v, i) => (
          <li
            key={i}
            className="rounded-xl border border-neutral-200/80 bg-white p-2.5 shadow-sm"
          >
            <p className="text-[13px] font-semibold leading-snug text-neutral-900">
              {v.brand}{v.model ? ` ${v.model}` : ""}{v.version ? ` · ${v.version}` : ""}
            </p>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-neutral-600">
              {v.year ? <span>Año: {v.year}</span> : null}
              {v.cc ? <span>{v.cc} CC</span> : null}
              {v.engine ? <span>Motor: {v.engine}</span> : null}
              {v.fuel ? <span>{v.fuel}</span> : null}
              {v.body ? <span>{v.body}</span> : null}
              {v.driven ? <span>{v.driven}</span> : null}
              {v.begin || v.end ? <span>{v.begin} — {v.end}</span> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TecdocResultView({ data }: { data: Record<string, unknown> }) {
  const articles = (data.articles as Array<Record<string, unknown>>) ?? [];
  if (articles.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-neutral-500">
        {articles.length} artículo{articles.length === 1 ? "" : "s"} TecDoc
        {data.matched_code ? ` · código: ${String(data.matched_code)}` : ""}
      </p>
      <ul className="space-y-1.5">
        {articles.map((a, i) => {
          const brand = String(a.mfrName ?? a.brandName ?? a.brand ?? "");
          const artNum = String(a.articleNumber ?? a.articleNo ?? "");
          const desc = String(a.genericArticleDescription ?? a.articleName ?? a.description ?? "");
          const images = (a.images as Array<Record<string, unknown>>) ?? [];
          const firstImg = images[0]
            ? String(images[0].imageURL200 ?? images[0].imageURL100 ?? images[0].imageURL ?? "")
            : "";
          const oeNumbers = (a.oeNumbers as Array<Record<string, unknown>>) ?? [];
          return (
            <li
              key={`${artNum}-${i}`}
              className="flex gap-3 rounded-xl border border-neutral-200/80 bg-white p-3 shadow-sm"
            >
              {firstImg ? (
                <img
                  src={firstImg}
                  alt={artNum}
                  className="h-14 w-14 shrink-0 rounded-lg border border-neutral-200/80 bg-white object-contain"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-neutral-200/80 bg-neutral-50 text-[9px] text-neutral-400">
                  TecDoc
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-neutral-900">{artNum}</p>
                {brand ? <p className="text-[11px] font-medium text-neutral-600">{brand}</p> : null}
                {desc ? <p className="mt-0.5 text-[11px] text-neutral-500">{desc}</p> : null}
                {oeNumbers.length > 0 ? (
                  <p className="mt-1 text-[10px] text-neutral-400">
                    OE: {oeNumbers.slice(0, 5).map((o) => String(o.oeNumber ?? o.articleNumber ?? "")).filter(Boolean).join(", ")}
                    {oeNumbers.length > 5 ? ` +${oeNumbers.length - 5}` : ""}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
