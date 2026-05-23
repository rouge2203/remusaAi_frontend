import { HiOutlineTruck } from "react-icons/hi2";

export interface VehiclePayload {
  source: "plate" | "vin";
  vin_source?: string;
  plate?: string;
  vin?: string;
  brand?: string;
  model?: string;
  year?: string;
  engine_size?: string;
  engine_code?: string;
  fuel?: string;
  body?: string;
  wheel_plan?: string;
  transmission?: string;
  color?: string;
  image_url?: string | null;
  owner?: string | null;
  description?: string;
}

export function parseVehicle(json: unknown): VehiclePayload | null {
  if (json == null || typeof json !== "object" || Array.isArray(json)) return null;
  const o = json as Record<string, unknown>;
  const source = o.source === "vin" || o.source === "plate" ? o.source : null;
  if (!source) return null;
  const s = (k: string) =>
    o[k] != null && typeof o[k] === "string" ? (o[k] as string).trim() : undefined;
  const sOrNull = (k: string) =>
    o[k] != null && typeof o[k] === "string" ? (o[k] as string).trim() : null;
  return {
    source,
    vin_source: s("vin_source"),
    plate: s("plate"),
    vin: s("vin"),
    brand: s("brand"),
    model: s("model"),
    year: s("year"),
    engine_size: s("engine_size"),
    engine_code: s("engine_code"),
    fuel: s("fuel"),
    body: s("body"),
    wheel_plan: s("wheel_plan"),
    transmission: s("transmission"),
    color: s("color"),
    image_url: sOrNull("image_url"),
    owner: sOrNull("owner"),
    description: s("description"),
  };
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline gap-2 text-[12px]">
      <span className="min-w-[88px] shrink-0 text-neutral-500">{label}</span>
      <span className="min-w-0 flex-1 text-neutral-900">{value}</span>
    </div>
  );
}

export default function VehicleCard({ data }: { data: VehiclePayload }) {
  const title =
    [data.brand, data.model].filter(Boolean).join(" ").trim() ||
    data.description ||
    "Vehículo identificado";
  const subtitle = data.description && data.description !== title ? data.description : null;
  const engine =
    [data.engine_size, data.engine_code].filter(Boolean).join(" · ") || undefined;
  const headerBadge =
    data.source === "plate" ? data.plate : data.vin_source || "VIN";

  return (
    <div className="my-2 w-full min-w-0 overflow-hidden rounded-2xl border border-neutral-200/90 bg-neutral-50 shadow-sm">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/15 bg-linear-to-b from-[#8f2330] to-[#75141C] px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold leading-tight text-white sm:text-[13px]">
            <span className="font-normal text-white/55">Vehículo · </span>
            <span className="break-all font-mono">{headerBadge}</span>
          </p>
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white sm:text-[10px]">
            <HiOutlineTruck className="text-[11px]" />
            {data.source === "plate" ? "placa CR" : "vin"}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:px-4 sm:py-4">
        {data.image_url ? (
          <div className="shrink-0 sm:w-40">
            <img
              src={data.image_url}
              alt={title}
              className="h-32 w-full rounded-xl border border-neutral-200 object-cover sm:h-28"
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : null}

        <div className="min-w-0 flex-1 space-y-2.5">
          <div>
            <p className="text-[14px] font-semibold leading-snug text-neutral-900">
              {title}
              {data.year ? (
                <span className="ml-2 rounded-md bg-[#75141C]/10 px-1.5 py-0.5 text-[11px] font-semibold text-[#75141C]">
                  {data.year}
                </span>
              ) : null}
            </p>
            {subtitle ? (
              <p className="mt-0.5 text-[11px] text-neutral-500">{subtitle}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            <Row label="Motor" value={engine} />
            <Row label="Combustible" value={data.fuel} />
            <Row label="Carrocería" value={data.body} />
            <Row label="Color" value={data.color} />
            <Row label="Transmisión" value={data.transmission} />
            <Row label="Tracción" value={data.wheel_plan} />
            <Row label="VIN" value={data.vin} />
            {data.owner ? <Row label="Propietario" value={data.owner} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
