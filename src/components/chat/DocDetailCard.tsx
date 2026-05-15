/**
 * DocDetailCard — renders a ```remusa-doc-detail``` fenced block as a styled card.
 *
 * Mirrors PartDetailCard in appearance: same header gradient, same rounded-2xl
 * card, same typography. Supports document types:
 *   pedido, cotizacion, factura, devolucion, cliente
 *
 * Clicking an articulo code in a line fires onPartClick(code) so the user
 * can chain directly into the part-detail flow.
 */

export interface DocDetailPayload {
  tipo: string;
  // Documents
  numero?: string;
  fecha?: string;
  fecha_prometida?: string;
  estado?: string;
  cliente?: { codigo: string; nombre: string };
  vendedor?: { codigo: string; nombre: string };
  zona?: string;
  condicion_pago?: string;
  totales?: {
    subtotal: number;
    impuesto: number;
    total: number;
    cancelado?: number;
    moneda: string;
  };
  orden_compra?: string;
  pedido_origen?: string;
  observaciones?: string;
  lineas?: Array<{
    linea?: number;
    articulo: string;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    total_linea: number;
    cantidad_pendiente?: number;
    estado?: string;
    fecha_entrega?: string;
  }>;
  // Cliente fields
  codigo?: string;
  nombre?: string;
  activo?: boolean;
  moroso?: boolean;
  telefono1?: string;
  email?: string;
  saldo?: { local: number; dolar: number };
  limite_credito?: number;
  pedidos_pendientes?: number;
  ultimo_pedido?: {
    pedido: string;
    estado: string;
    fecha: string;
    total: number;
    moneda: string;
  } | null;
  ultima_factura?: {
    factura: string;
    fecha: string;
    total: number;
    moneda: string;
  } | null;
}

export function parseDocDetail(json: unknown): DocDetailPayload | null {
  if (json == null || typeof json !== "object" || Array.isArray(json)) return null;
  const o = json as Record<string, unknown>;
  const tipo = String(o.tipo ?? "").trim().toLowerCase();
  if (!tipo) return null;

  // At minimum we need tipo and either numero or codigo
  const hasDocFields = o.numero != null || o.codigo != null;
  if (!hasDocFields) return null;

  return o as unknown as DocDetailPayload;
}

const TIPO_LABEL: Record<string, string> = {
  pedido: "Pedido",
  cotizacion: "Cotización",
  factura: "Factura",
  devolucion: "Devolución",
  cliente: "Cliente",
};

const STATUS_CLASSES: Record<string, string> = {
  pendiente: "border-amber-300 bg-amber-50 text-amber-700",
  "en proceso": "border-blue-300 bg-blue-50 text-blue-700",
  parcial: "border-orange-300 bg-orange-50 text-orange-700",
  facturado: "border-green-300 bg-green-50 text-green-700",
  vigente: "border-green-300 bg-green-50 text-green-700",
  anulado: "border-neutral-300 bg-neutral-100 text-neutral-500",
  cancelado: "border-neutral-300 bg-neutral-100 text-neutral-500",
  activo: "border-green-300 bg-green-50 text-green-700",
  inactivo: "border-neutral-300 bg-neutral-100 text-neutral-500",
  moroso: "border-red-300 bg-red-50 text-red-700",
};

const money = (n: number | undefined, currency: string) => {
  if (n == null || !Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: currency === "USD" ? "USD" : "CRC",
      minimumFractionDigits: 2,
    }).format(n);
  } catch {
    return `₡${n.toLocaleString("es-CR", { minimumFractionDigits: 2 })}`;
  }
};

interface DocDetailCardProps {
  data: DocDetailPayload;
  onPartClick?: (code: string) => void;
}

export default function DocDetailCard({ data, onPartClick }: DocDetailCardProps) {
  const tipo = data.tipo?.toLowerCase() ?? "";
  const tipoLabel = TIPO_LABEL[tipo] ?? tipo.toUpperCase();
  const isCliente = tipo === "cliente";
  const moneda = data.totales?.moneda ?? data.saldo ? "CRC" : "CRC";

  const estadoStr = isCliente
    ? data.activo ? (data.moroso ? "moroso" : "activo") : "inactivo"
    : (data.estado ?? "");

  const statusClass = STATUS_CLASSES[estadoStr.toLowerCase()] ?? "border-neutral-200 bg-neutral-50 text-neutral-600";

  const titulo = isCliente
    ? (data.nombre ?? data.codigo ?? "")
    : (data.numero ?? "");

  const subtitulo = isCliente
    ? data.codigo
    : (data.cliente?.nombre ?? "");

  return (
    <div className="my-2 w-full min-w-0 overflow-hidden rounded-2xl border border-neutral-200/90 bg-neutral-50 shadow-sm">
      {/* Header */}
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/15 bg-linear-to-b from-[#8f2330] to-[#75141C] px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold leading-tight text-white sm:text-[13px]">
            <span className="font-normal text-white/55">{tipoLabel} Softland · </span>
            <span className="break-all font-mono">{titulo}</span>
          </p>
          {subtitulo && (
            <p className="mt-0.5 truncate text-[11px] text-white/70">{subtitulo}</p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {estadoStr && (
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${statusClass}`}
              >
                {estadoStr}
              </span>
            )}
            {data.fecha && (
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                {data.fecha}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 px-3 py-3 sm:px-4 sm:py-4">
        {/* Cliente/Vendedor row (document view) */}
        {!isCliente && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {data.cliente && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                  Cliente
                </p>
                <p className="text-[12px] font-medium text-neutral-800">
                  {data.cliente.nombre}
                </p>
                <p className="font-mono text-[10px] text-neutral-500">{data.cliente.codigo}</p>
              </div>
            )}
            {data.vendedor && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                  Vendedor
                </p>
                <p className="text-[12px] font-medium text-neutral-800">
                  {data.vendedor.nombre}
                </p>
                <p className="font-mono text-[10px] text-neutral-500">{data.vendedor.codigo}</p>
              </div>
            )}
          </div>
        )}

        {/* Cliente detail (client view) */}
        {isCliente && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {data.vendedor && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                  Vendedor
                </p>
                <p className="text-[12px] font-medium text-neutral-800">{data.vendedor.nombre}</p>
              </div>
            )}
            {data.zona && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                  Zona
                </p>
                <p className="text-[12px] font-medium text-neutral-800">{data.zona}</p>
              </div>
            )}
            {data.telefono1 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                  Teléfono
                </p>
                <p className="text-[12px] text-neutral-800">{data.telefono1}</p>
              </div>
            )}
            {data.email && (
              <div className="sm:col-span-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                  Email
                </p>
                <p className="truncate text-[12px] text-neutral-800">{data.email}</p>
              </div>
            )}
          </div>
        )}

        {/* Extra doc fields */}
        {(data.fecha_prometida || data.orden_compra || data.pedido_origen || data.condicion_pago) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-600">
            {data.fecha_prometida && (
              <span>
                <span className="font-medium text-neutral-700">Prometida: </span>
                {data.fecha_prometida}
              </span>
            )}
            {data.orden_compra && (
              <span>
                <span className="font-medium text-neutral-700">OC: </span>
                {data.orden_compra}
              </span>
            )}
            {data.pedido_origen && (
              <span>
                <span className="font-medium text-neutral-700">Pedido: </span>
                {data.pedido_origen}
              </span>
            )}
            {data.condicion_pago && (
              <span>
                <span className="font-medium text-neutral-700">Pago: </span>
                {data.condicion_pago}
              </span>
            )}
          </div>
        )}

        {/* Totales (document) */}
        {data.totales && (
          <div className="rounded-xl border border-neutral-200/80 bg-white px-3 py-2.5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#75141C]/90">
              Totales
            </p>
            <div className="space-y-1 text-[12px]">
              <div className="flex justify-between">
                <span className="text-neutral-500">Subtotal</span>
                <span className="font-mono text-neutral-800">{money(data.totales.subtotal, data.totales.moneda)}</span>
              </div>
              {data.totales.impuesto > 0 && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Impuesto</span>
                  <span className="font-mono text-neutral-800">{money(data.totales.impuesto, data.totales.moneda)}</span>
                </div>
              )}
              {data.totales.cancelado != null && data.totales.cancelado > 0 && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Cancelado</span>
                  <span className="font-mono text-neutral-800">{money(data.totales.cancelado, data.totales.moneda)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-neutral-100 pt-1">
                <span className="font-semibold text-neutral-800">Total</span>
                <span className="font-mono font-semibold text-neutral-900">{money(data.totales.total, data.totales.moneda)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Saldo (cliente view) */}
        {isCliente && data.saldo != null && (
          <div className="rounded-xl border border-neutral-200/80 bg-white px-3 py-2.5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#75141C]/90">
              Cuenta
            </p>
            <div className="space-y-1 text-[12px]">
              <div className="flex justify-between">
                <span className="text-neutral-500">Saldo local</span>
                <span className="font-mono text-neutral-800">{money(data.saldo.local, "CRC")}</span>
              </div>
              {data.saldo.dolar > 0 && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Saldo dólares</span>
                  <span className="font-mono text-neutral-800">{money(data.saldo.dolar, "USD")}</span>
                </div>
              )}
              {data.limite_credito != null && (
                <div className="flex justify-between border-t border-neutral-100 pt-1">
                  <span className="font-medium text-neutral-700">Límite crédito</span>
                  <span className="font-mono text-neutral-800">{money(data.limite_credito, "CRC")}</span>
                </div>
              )}
              {data.pedidos_pendientes != null && (
                <div className="flex justify-between">
                  <span className="font-medium text-neutral-700">Pedidos pendientes</span>
                  <span className="font-mono font-semibold text-neutral-900">{data.pedidos_pendientes}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Last pedido/factura (cliente view) */}
        {isCliente && (data.ultimo_pedido || data.ultima_factura) && (
          <div className="grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-2">
            {data.ultimo_pedido && (
              <div className="rounded-lg border border-neutral-200 bg-white px-2.5 py-2">
                <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-neutral-400">
                  Último pedido
                </p>
                <p className="font-mono font-semibold text-[#75141C]">{data.ultimo_pedido.pedido}</p>
                <p className="text-neutral-600">{data.ultimo_pedido.fecha}</p>
                <p className="font-mono text-neutral-800">{money(data.ultimo_pedido.total, data.ultimo_pedido.moneda)}</p>
                <span className={`mt-1 inline-flex rounded-full border px-1.5 py-px text-[8px] font-semibold uppercase ${STATUS_CLASSES[data.ultimo_pedido.estado] ?? "border-neutral-200 text-neutral-500"}`}>
                  {data.ultimo_pedido.estado}
                </span>
              </div>
            )}
            {data.ultima_factura && (
              <div className="rounded-lg border border-neutral-200 bg-white px-2.5 py-2">
                <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-neutral-400">
                  Última factura
                </p>
                <p className="break-all font-mono font-semibold text-[#75141C] text-[10px]">{data.ultima_factura.factura}</p>
                <p className="text-neutral-600">{data.ultima_factura.fecha}</p>
                <p className="font-mono text-neutral-800">{money(data.ultima_factura.total, data.ultima_factura.moneda)}</p>
              </div>
            )}
          </div>
        )}

        {/* Lines table (document view) */}
        {data.lineas && data.lineas.length > 0 && (
          <div className="rounded-xl border border-neutral-200/80 bg-white px-3 py-2.5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#75141C]/90">
              Líneas ({data.lineas.length})
            </p>
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-neutral-100 text-left text-[9px] font-semibold uppercase tracking-wide text-neutral-400">
                    <th className="pb-1 pr-2">Código</th>
                    <th className="pb-1 pr-2">Descripción</th>
                    <th className="pb-1 pr-2 text-right">Cant.</th>
                    <th className="pb-1 pr-2 text-right">P.Unit.</th>
                    <th className="pb-1 text-right">Total</th>
                    {data.lineas.some((l) => l.cantidad_pendiente != null) && (
                      <th className="pb-1 pl-2 text-right">Pend.</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.lineas.map((l, idx) => (
                    <tr key={idx} className="border-b border-neutral-50 last:border-0">
                      <td className="py-1 pr-2">
                        {onPartClick ? (
                          <button
                            type="button"
                            onClick={() => onPartClick(l.articulo)}
                            className="font-mono font-semibold text-[#75141C] hover:underline"
                          >
                            {l.articulo}
                          </button>
                        ) : (
                          <span className="font-mono font-semibold text-[#75141C]">{l.articulo}</span>
                        )}
                      </td>
                      <td className="py-1 pr-2 text-neutral-700">
                        <span className="line-clamp-2">{l.descripcion}</span>
                        {l.fecha_entrega && (
                          <span className="block text-[9px] text-neutral-400">
                            Entrega: {l.fecha_entrega}
                          </span>
                        )}
                      </td>
                      <td className="py-1 pr-2 text-right tabular-nums text-neutral-800">{l.cantidad}</td>
                      <td className="py-1 pr-2 text-right tabular-nums text-neutral-800">
                        {money(l.precio_unitario, moneda)}
                      </td>
                      <td className="py-1 text-right tabular-nums font-medium text-neutral-900">
                        {money(l.total_linea, moneda)}
                      </td>
                      {data.lineas!.some((ln) => ln.cantidad_pendiente != null) && (
                        <td className={`py-1 pl-2 text-right tabular-nums font-medium ${l.cantidad_pendiente ? "text-amber-700" : "text-neutral-400"}`}>
                          {l.cantidad_pendiente ?? "—"}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Observaciones */}
        {data.observaciones && (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
              Observaciones
            </p>
            <p className="text-[11px] leading-relaxed text-neutral-700">{data.observaciones}</p>
          </div>
        )}
      </div>
    </div>
  );
}
