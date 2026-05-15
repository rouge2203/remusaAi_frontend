import { useRef, useCallback } from "react";
import { toPng } from "html-to-image";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface ChartSpec {
  type: "bar" | "line" | "area" | "pie" | "donut";
  title: string;
  subtitle?: string;
  x_label?: string;
  y_label?: string;
  data: { name: string; value: number; [k: string]: unknown }[];
  color?: "primary" | "blue" | "neutral";
}

const COLOR_PALETTES: Record<NonNullable<ChartSpec["color"]>, string[]> = {
  primary: [
    "#75141C", "#a01c28", "#c42231", "#e03040", "#f06070",
    "#f49098", "#f8b8bc", "#8a2030", "#6a0e16", "#4a080e",
  ],
  blue: [
    "#4A9ED1", "#2a7eb1", "#1a6091", "#2d9ecf", "#5bb3d8",
    "#7ec5e2", "#a1d6ec", "#3a8ec1", "#1a5e91", "#0a3e61",
  ],
  neutral: [
    "#6b7280", "#9ca3af", "#4b5563", "#374151", "#d1d5db",
    "#e5e7eb", "#1f2937", "#111827", "#f3f4f6", "#f9fafb",
  ],
};

function getColors(color: ChartSpec["color"] = "primary"): string[] {
  return COLOR_PALETTES[color] ?? COLOR_PALETTES.primary;
}

function formatValue(v: number): string {
  if (Math.abs(v) >= 1_000_000)
    return `${(v / 1_000_000).toLocaleString("es-CR", { maximumFractionDigits: 1 })}M`;
  if (Math.abs(v) >= 1_000)
    return `${(v / 1_000).toLocaleString("es-CR", { maximumFractionDigits: 1 })}K`;
  return v.toLocaleString("es-CR", { maximumFractionDigits: 1 });
}

function csvFromData(data: ChartSpec["data"]): string {
  if (!data.length) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map((r) =>
    headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface ExportToolbarProps {
  chartRef: React.RefObject<HTMLDivElement | null>;
  data: ChartSpec["data"];
  title: string;
}

function ExportToolbar({ chartRef, data, title }: ExportToolbarProps) {
  const slug = title.replace(/[^a-z0-9]/gi, "_").toLowerCase().slice(0, 40);

  const exportPng = useCallback(async () => {
    if (!chartRef.current) return;
    try {
      const dataUrl = await toPng(chartRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${slug}.png`;
      a.click();
    } catch {
      /* silently ignore */
    }
  }, [chartRef, slug]);

  const exportCsv = useCallback(() => {
    const csv = csvFromData(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${slug}.csv`);
  }, [data, slug]);

  const exportXlsx = useCallback(() => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Datos");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    downloadBlob(blob, `${slug}.xlsx`);
  }, [data, slug]);

  const btnClass =
    "rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-600 transition hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 active:scale-95";

  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={exportPng} className={btnClass} title="Exportar como PNG">
        PNG
      </button>
      <button type="button" onClick={exportCsv} className={btnClass} title="Exportar como CSV">
        CSV
      </button>
      <button type="button" onClick={exportXlsx} className={btnClass} title="Exportar como Excel">
        XLSX
      </button>
    </div>
  );
}

// ── Chart renderers ────────────────────────────────────────────────────────

interface ChartBodyProps {
  spec: ChartSpec;
  colors: string[];
}

function BarBody({ spec, colors }: ChartBodyProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={spec.data} margin={{ top: 4, right: 12, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: "#6b7280" }}
          angle={-35}
          textAnchor="end"
          interval={0}
          label={
            spec.x_label
              ? { value: spec.x_label, position: "insideBottom", offset: -48, fontSize: 10, fill: "#9ca3af" }
              : undefined
          }
        />
        <YAxis
          tickFormatter={formatValue}
          tick={{ fontSize: 10, fill: "#6b7280" }}
          width={52}
          label={
            spec.y_label
              ? { value: spec.y_label, angle: -90, position: "insideLeft", fontSize: 10, fill: "#9ca3af" }
              : undefined
          }
        />
        <Tooltip formatter={(v: number) => [v.toLocaleString("es-CR"), ""]} labelStyle={{ fontSize: 11 }} contentStyle={{ fontSize: 11 }} />
        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
          {spec.data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function LineBody({ spec, colors }: ChartBodyProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={spec.data} margin={{ top: 4, right: 12, left: 0, bottom: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: "#6b7280" }}
          label={
            spec.x_label
              ? { value: spec.x_label, position: "insideBottom", offset: -16, fontSize: 10, fill: "#9ca3af" }
              : undefined
          }
        />
        <YAxis
          tickFormatter={formatValue}
          tick={{ fontSize: 10, fill: "#6b7280" }}
          width={52}
          label={
            spec.y_label
              ? { value: spec.y_label, angle: -90, position: "insideLeft", fontSize: 10, fill: "#9ca3af" }
              : undefined
          }
        />
        <Tooltip formatter={(v: number) => [v.toLocaleString("es-CR"), ""]} contentStyle={{ fontSize: 11 }} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={colors[0]}
          strokeWidth={2}
          dot={{ r: 3, fill: colors[0] }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function AreaBody({ spec, colors }: ChartBodyProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={spec.data} margin={{ top: 4, right: 12, left: 0, bottom: 24 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors[0]} stopOpacity={0.25} />
            <stop offset="95%" stopColor={colors[0]} stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: "#6b7280" }}
          label={
            spec.x_label
              ? { value: spec.x_label, position: "insideBottom", offset: -16, fontSize: 10, fill: "#9ca3af" }
              : undefined
          }
        />
        <YAxis
          tickFormatter={formatValue}
          tick={{ fontSize: 10, fill: "#6b7280" }}
          width={52}
          label={
            spec.y_label
              ? { value: spec.y_label, angle: -90, position: "insideLeft", fontSize: 10, fill: "#9ca3af" }
              : undefined
          }
        />
        <Tooltip formatter={(v: number) => [v.toLocaleString("es-CR"), ""]} contentStyle={{ fontSize: 11 }} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={colors[0]}
          strokeWidth={2}
          fill="url(#areaGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function PieBody({ spec, colors, donut }: ChartBodyProps & { donut?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={spec.data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={85}
          innerRadius={donut ? 42 : 0}
          paddingAngle={2}
          label={({ name, percent }) =>
            percent > 0.04 ? `${name} ${(percent * 100).toFixed(0)}%` : ""
          }
          labelLine={false}
        >
          {spec.data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => [v.toLocaleString("es-CR"), ""]} contentStyle={{ fontSize: 11 }} />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

interface ChartBlockProps {
  spec: ChartSpec;
}

export default function ChartBlock({ spec }: ChartBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = getColors(spec.color);

  const renderChart = () => {
    switch (spec.type) {
      case "line":
        return <LineBody spec={spec} colors={colors} />;
      case "area":
        return <AreaBody spec={spec} colors={colors} />;
      case "pie":
        return <PieBody spec={spec} colors={colors} />;
      case "donut":
        return <PieBody spec={spec} colors={colors} donut />;
      case "bar":
      default:
        return <BarBody spec={spec} colors={colors} />;
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-3.5 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-neutral-800">{spec.title}</p>
          {spec.subtitle && (
            <p className="mt-0.5 truncate text-[10px] text-neutral-400">{spec.subtitle}</p>
          )}
        </div>
        <ExportToolbar chartRef={containerRef} data={spec.data} title={spec.title} />
      </div>
      <div ref={containerRef} className="px-2 pb-3 pt-2 bg-white">
        {renderChart()}
      </div>
    </div>
  );
}
