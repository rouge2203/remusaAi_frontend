/**
 * Django RemusaAi backend (default: dev proxy /api → localhost:8000).
 * Secrets live on the server; browser only calls /api/*.
 */
import type { PartResult, VehicleInfo, VinDecodeResult } from "../types";

const API_ROOT = `${import.meta.env.VITE_API_BASE ?? ""}`.replace(/\/$/, "") + "/api";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_ROOT}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Respuesta no JSON (${res.status})`);
  }
  if (!res.ok) {
    const err = (data as { error?: string; detail?: string })?.error
      ?? (data as { detail?: string })?.detail
      ?? `Error ${res.status}`;
    throw new Error(typeof err === "string" ? err : JSON.stringify(err));
  }
  return data as T;
}

function qs(params: Record<string, string | number | undefined | null>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    u.set(k, String(v));
  }
  const s = u.toString();
  return s ? `?${s}` : "";
}

/** RegCheck / Django may return strings or `{ CurrentTextValue }`. */
export function pickText(v: unknown): string {
  if (v == null || v === "") return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && v !== null && "CurrentTextValue" in v) {
    const o = v as { CurrentTextValue?: unknown };
    return o.CurrentTextValue != null ? String(o.CurrentTextValue) : "";
  }
  return String(v);
}

export function mapRegcheckToVehicleInfo(raw: Record<string, unknown>): VehicleInfo {
  return {
    description: String(raw.Description ?? ""),
    carMake: pickText(raw.CarMake),
    carModel: pickText(raw.CarModel),
    registrationYear: String(raw.RegistrationYear ?? ""),
    engineSize: pickText(raw.EngineSize),
    body: String(raw.Body ?? ""),
    fuel: String(raw.Fuel ?? ""),
    wheelPlan: String(raw.WheelPlan ?? ""),
    colour: String(raw.Colour ?? ""),
    vin: String(raw.VIN ?? ""),
    engineCode: String(raw.EngineCode ?? ""),
    owner: String(raw.owner ?? ""),
    imageUrl: raw.ImageUrl ? String(raw.ImageUrl) : undefined,
  };
}

function _17vinImgProxy(path: string): string {
  return `${API_ROOT}/epc/img/?path=${encodeURIComponent(path)}`;
}

export function imageUrlFromPart(epc: string, partImg?: string): string | undefined {
  if (!partImg) return undefined;
  const img = partImg.includes(",") ? partImg.split(",")[0].trim() : partImg;
  if (!img) return undefined;
  const fullPath = img.startsWith("http")
    ? img.replace(/^https?:\/\/resource\.17vin\.com\/img\//, "")
    : img.includes("/") ? img : `${epc}/${img}`;
  return _17vinImgProxy(fullPath);
}

export function diagramUrl(epc: string, imgAddress?: string): string | undefined {
  if (!imgAddress) return undefined;
  const addr = imgAddress.includes(",") ? imgAddress.split(",")[0].trim() : imgAddress;
  if (!addr) return undefined;
  const fullPath = addr.startsWith("http")
    ? addr.replace(/^https?:\/\/resource\.17vin\.com\/img\//, "")
    : addr.includes("/") ? addr : `${epc}/${addr}`;
  return _17vinImgProxy(fullPath);
}

/** Image URL from 17VIN parts/illustration API response (first match). */
export function illustrationImageUrl(epc: string, payload: Record<string, unknown>): string | undefined {
  const urls = illustrationImageUrls(epc, payload);
  return urls.length > 0 ? urls[0] : undefined;
}

/** All illustration image URLs from 17VIN parts/illustration API response. */
export function illustrationImageUrls(epc: string, payload: Record<string, unknown>): string[] {
  const d = payload.data as Record<string, unknown> | undefined;

  const directImg =
    (d?.imgaddress as string) ||
    (d?.imgAddress as string) ||
    (payload.imgaddress as string) ||
    "";
  if (directImg) {
    const url = diagramUrl(epc, directImg);
    return url ? [url] : [];
  }

  const searchlist =
    (d?.searchlist as Array<Record<string, unknown>>) ??
    (payload.searchlist as Array<Record<string, unknown>>) ??
    [];
  if (!searchlist.length) return [];

  const seen = new Set<string>();
  const urls: string[] = [];
  for (const item of searchlist) {
    const raw = String(item.illustration_img_address ?? item.Illustration_img_address ?? "").trim();
    if (!raw) continue;
    const url = diagramUrl(epc, raw);
    if (url && !seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  }
  return urls;
}

/** Full 17VIN decode response wrapper `{ code, msg, data }`. */
function modelSpecificationFrom17vinRow(m: Record<string, unknown>): string {
  const detail =
    String(m.Model_detial_en ?? m.Model_detail ?? m.Model_detial ?? "").trim();
  if (detail) return detail;
  const model = String(m.Model_en ?? m.Model ?? "").trim();
  const series = String(m.Series_en ?? m.Series ?? "").trim();
  if (model && series && series !== model) return `${model} · ${series}`;
  return model || series;
}

export function map17vinDecodeToUi(result: Record<string, unknown>): VinDecodeResult {
  const data = (result.data as Record<string, unknown>) ?? {};
  const modelList = (data.model_list as Array<Record<string, unknown>>) ?? [];
  const first = modelList[0] ?? {};
  return {
    epc: String(data.epc ?? ""),
    epcId: String(data.epc_id ?? ""),
    brand: String(data.brand ?? ""),
    modelSpecification: modelSpecificationFrom17vinRow(first),
    modelYear: String(data.model_year_from_vin ?? ""),
    buildDate: String(data.build_date ?? ""),
    madeIn: String(data.made_in_en ?? data.made_in_cn ?? ""),
    matchingMode: String(data.matching_mode ?? ""),
    models: modelList.slice(0, 8).map((m) => ({
      brand: String(m.Brand_en ?? m.Brand ?? first.Brand_en ?? first.Brand ?? ""),
      model: String(m.Model_en ?? m.Model ?? ""),
      cc: String(m.Cc ?? ""),
      engine: String(m.Engine_no_en ?? m.Engine_no ?? ""),
      transmission: String(m.Transmission_detail_en ?? m.Transmission_detail ?? ""),
      drive: String(m.Driving_mode_en ?? m.Driving_mode ?? ""),
      year: String(m.Model_year ?? ""),
      series: String(m.Series_en ?? m.Series ?? ""),
      factory: String(m.Factory_en ?? m.Factory ?? ""),
      bodyType: String(m.Car_type_en ?? m.Car_type ?? ""),
    })),
  };
}

export function mapPartRowToPartResult(p: Record<string, unknown>, fallbackPn: string): PartResult {
  const epc = String(p.Epc ?? p.epc ?? "");
  const imgRaw = p.Part_img ?? p.part_img;
  return {
    partNumber: String(p.Partnumber ?? p.partnumber ?? fallbackPn),
    partNameEn: String(p.Part_name_en ?? p.name_en ?? ""),
    partNameZh: String(p.Part_name_zh ?? ""),
    brandNameEn: String(p.Brand_name_en ?? ""),
    brandNameZh: String(p.Brand_name_zh ?? ""),
    epc,
    groupId: String(p.Group_id ?? p.group_id ?? ""),
    partImg: imageUrlFromPart(epc, imgRaw != null ? String(imgRaw) : undefined),
    remusaMatch: false,
  };
}

// --- Vehicle ---

export async function plateLookup(plate: string): Promise<{ plate: string; vehicle: Record<string, unknown> }> {
  return apiFetch("/vehicle/plate-lookup/", {
    method: "POST",
    body: JSON.stringify({ plate: plate.trim() }),
  });
}

export async function vinDecode(vin: string): Promise<{ vin: string; result: Record<string, unknown> | null }> {
  return apiFetch("/vehicle/vin-decode/", {
    method: "POST",
    body: JSON.stringify({ vin: vin.trim().toUpperCase() }),
  });
}

export async function vinCheckTecdoc(vin: string): Promise<{ vin: string; result: Record<string, unknown> }> {
  return apiFetch("/vehicle/vin-check-tecdoc/", {
    method: "POST",
    body: JSON.stringify({ vin: vin.trim().toUpperCase() }),
  });
}

export async function tecdocVehicleInfo(vehicleId: string | number): Promise<{ vehicle_id: string; info: Record<string, unknown> }> {
  return apiFetch(`/vehicle/tecdoc-info/${encodeURIComponent(String(vehicleId))}/`);
}

// --- EPC ---

export async function epcCategories(params: {
  epc: string;
  vin: string;
  level: number;
  parent_code?: string;
  epc_id?: string;
}): Promise<{ epc: string; level: number; categories: Array<Record<string, unknown>> }> {
  return apiFetch(`/epc/categories/${qs(params)}`);
}

export async function epcParts(params: {
  epc: string;
  vin: string;
  cata_code: string;
  level: string | number;
  epc_id?: string;
}): Promise<Record<string, unknown>> {
  return apiFetch(`/epc/parts/${qs(params)}`);
}

export async function epcSearchPart(params: {
  epc: string;
  vin: string;
  part_number: string;
  epc_id?: string;
}): Promise<Record<string, unknown>> {
  return apiFetch(`/epc/search-part/${qs({ ...params, part_number: params.part_number })}`);
}

export async function epcAllOe(epc: string, vin: string): Promise<{ total: number; parts: string[] }> {
  return apiFetch(`/epc/all-oe-numbers/${qs({ epc, vin })}`);
}

// --- Parts (17VIN) ---

export async function partsSearchFuzzy(query: string): Promise<{ query: string; results: Array<Record<string, unknown>> }> {
  return apiFetch(`/parts/search-fuzzy/${encodeURIComponent(query)}/`);
}

export async function partsSearchExact(partNumber: string): Promise<{ part_number: string; results: Array<Record<string, unknown>> }> {
  return apiFetch(`/parts/search/${encodeURIComponent(partNumber)}/`);
}

export async function partsInterchange(partNumber: string): Promise<{ part_number: string; data: Record<string, unknown> }> {
  return apiFetch(`/parts/interchange/${encodeURIComponent(partNumber)}/`);
}

export async function partsVehicles(partNumber: string): Promise<{ part_number: string; data: Record<string, unknown> }> {
  return apiFetch(`/parts/vehicles/${encodeURIComponent(partNumber)}/`);
}

export async function partsVehiclesAftermarket(partNumber: string): Promise<{ part_number: string; data: Record<string, unknown> }> {
  return apiFetch(`/parts/vehicles-aftermarket/${encodeURIComponent(partNumber)}/`);
}

export async function partsPrice(partNumber: string): Promise<{ part_number: string; prices: unknown }> {
  return apiFetch(`/parts/price/${encodeURIComponent(partNumber)}/`);
}

export async function partsIllustration(params: {
  epc: string;
  part_number: string;
  cata_code?: string;
}): Promise<Record<string, unknown>> {
  return apiFetch(`/parts/illustration/${qs(params)}`);
}

// --- TecDoc ---

export async function tecdocCategories(vehicleId: string | number): Promise<{ vehicle_id: string; categories: unknown }> {
  return apiFetch(`/tecdoc/categories/${encodeURIComponent(String(vehicleId))}/`);
}

export async function tecdocArticles(
  vehicleId: string | number,
  categoryId: string | number,
): Promise<{ articles: Array<Record<string, unknown>>; total: number }> {
  return apiFetch(`/tecdoc/articles/${encodeURIComponent(String(vehicleId))}/${encodeURIComponent(String(categoryId))}/`);
}

export async function tecdocPartLookup(partNumber: string, fallbackCodes?: string): Promise<Record<string, unknown>> {
  const q = fallbackCodes ? qs({ fallback_codes: fallbackCodes }) : "";
  return apiFetch(`/tecdoc/part-lookup/${encodeURIComponent(partNumber)}/${q}`);
}

export async function tecdocArticleDetail(articleId: string | number): Promise<{ detail: Record<string, unknown> }> {
  return apiFetch(`/tecdoc/article-detail/${encodeURIComponent(String(articleId))}/`);
}

/** Variants for a TecDoc modelId (after VIN → model without vehicle). */
export async function tecdocListVehiclesForModel(
  modelId: string | number,
): Promise<{ model_id: string; vehicles: Array<Record<string, unknown>>; total: number }> {
  return apiFetch(`/tecdoc/model-vehicles/${encodeURIComponent(String(modelId))}/`);
}

// --- REMUSA ---

export async function remusaLookup(partNumber: string): Promise<Record<string, unknown>> {
  return apiFetch(`/remusa/lookup/${encodeURIComponent(partNumber)}/`);
}

export async function remusaDetail(articuloCode: string): Promise<Record<string, unknown>> {
  return apiFetch(`/remusa/detail/${encodeURIComponent(articuloCode)}/`);
}

export async function remusaEquivSearch(partNumber: string): Promise<Record<string, unknown>> {
  return apiFetch(`/remusa/equiv-search/${encodeURIComponent(partNumber)}/`);
}

export async function remusaMatchVehicleOe(epc: string, vin: string): Promise<Record<string, unknown>> {
  return apiFetch("/remusa/match-vehicle-oe/", {
    method: "POST",
    body: JSON.stringify({ epc, vin }),
  });
}

export type RemusaBatchHit = { articulo: string; desc: string; source: string };

/** POST /api/remusa/batch-check/ — maps OE PN -> REMUSA hit (same logic as SistemaRemusa _check_parts_remusa). */
export async function remusaBatchCheck(partNumbers: string[]): Promise<{
  checked: number;
  matched: number;
  results: Record<string, RemusaBatchHit>;
}> {
  return apiFetch("/remusa/batch-check/", {
    method: "POST",
    body: JSON.stringify({ part_numbers: partNumbers }),
  });
}

/** Placeholder decode when TecDoc matched manufacturer/models but user must pick model/variant. */
export function tecdocPendingModelVinDecode(manuName: string, _vin: string): VinDecodeResult {
  return {
    epc: "tecdoc",
    epcId: "",
    brand: manuName || "TecDoc",
    modelSpecification: "Seleccione modelo TecDoc",
    modelYear: "",
    buildDate: "",
    madeIn: "",
    matchingMode: "TecDoc VIN",
    models: [],
  };
}

export function tecdocVehicleToVinDecode(
  vehicle: Record<string, unknown>,
  _vin: string,
): VinDecodeResult {
  const vid = vehicle.vehicleId ?? vehicle.vehicle_id;
  const label =
    String(vehicle.carName ?? vehicle.vehicleTypeDescription ?? vehicle.manuName ?? "TecDoc");
  return {
    epc: "tecdoc",
    epcId: String(vid ?? ""),
    brand: String(vehicle.manuName ?? vehicle.make ?? "TecDoc"),
    modelSpecification: label,
    modelYear: String(vehicle.yearOfConstructionFrom ?? vehicle.year ?? ""),
    buildDate: "",
    madeIn: "",
    matchingMode: "TecDoc VIN",
    models: [
      {
        brand: String(vehicle.manuName ?? ""),
        model: label,
        cc: String(vehicle.capacityCC ?? vehicle.ccm ?? ""),
        engine: String(vehicle.engineCode ?? ""),
        transmission: "",
        drive: String(vehicle.driveType ?? ""),
        year: String(vehicle.yearOfConstructionFrom ?? ""),
        series: "",
        factory: "",
        bodyType: String(vehicle.bodyType ?? ""),
      },
    ],
  };
}
