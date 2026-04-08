import { useState, useCallback } from "react";
import type {
  SearchState,
  SearchMode,
  CatalogSession,
  TecdocVehicleOption,
  TecdocModelOption,
  VinDecodeResult,
  PartResult,
} from "../types";
import { isMockMode, searchByPlate, decodeVin, searchByPartCode } from "../lib/api";
import * as remusa from "../lib/remusaApi";

const PLATE_MESSAGES = [
  "Conectando con registro vehicular...",
  "Consultando placa en Costa Rica...",
  "Vehículo encontrado, extrayendo datos...",
  "Decodificando VIN...",
  "Consultando catálogo EPC...",
  "Listo.",
];

const VIN_MESSAGES = [
  "Validando formato VIN...",
  "Consultando base de datos 17VIN...",
  "Decodificando información del vehículo...",
  "Identificando modelo y motor...",
  "Listo.",
];

const PART_MESSAGES = [
  "Buscando código de parte...",
  "Consultando catálogos EPC...",
  "Verificando disponibilidad REMUSA...",
  "Listo.",
];

const TECDOC_MODEL_MESSAGES = [
  "Consultando variantes TecDoc para el modelo…",
  "Resolviendo vehículos compatibles…",
  "Listo.",
];

function emptyStateBase(): Omit<SearchState, "activeBlock" | "loading" | "loadingMessages"> {
  return {
    lastVin: null,
    vehicleInfo: null,
    vinDecode: null,
    vinDecodeRaw: null,
    partResults: [],
    error: null,
    plateNotFoundToast: false,
    catalogSession: null,
    tecdocPicklist: null,
    tecdocModelPicklist: null,
    partRemusaMap: {},
    partDirectRemusa: null,
  };
}

const PLATE_NOT_FOUND_MSG = "No se encontró información para esta placa.";

function extractTecdocVehicles(result: Record<string, unknown>): Array<Record<string, unknown>> {
  const v = result.vehicles;
  if (Array.isArray(v)) return v;
  const mv = (result as { matchingVehicles?: unknown }).matchingVehicles;
  if (Array.isArray(mv)) return mv;
  return [];
}

function toTecdocOptions(vehicles: Array<Record<string, unknown>>): TecdocVehicleOption[] {
  return vehicles.map((v, i) => {
    const id = String(v.vehicleId ?? v.vehicle_id ?? i);
    const label = String(
      v.carName ??
        v.vehicleTypeDescription ??
        v.typeEngineName ??
        v.manuName ??
        `Vehículo ${id}`,
    );
    return { id, label, raw: v };
  });
}

function extractTecdocModels(result: Record<string, unknown>): Array<Record<string, unknown>> {
  const m = result.models;
  if (Array.isArray(m)) return m;
  const mm = (result as { matchingModels?: unknown }).matchingModels;
  if (Array.isArray(mm)) return mm as Array<Record<string, unknown>>;
  return [];
}

function extractTecdocManufacturers(result: Record<string, unknown>): Array<Record<string, unknown>> {
  const m = result.manufacturers;
  if (Array.isArray(m)) return m;
  const mm = (result as { matchingManufacturers?: unknown }).matchingManufacturers;
  if (Array.isArray(mm)) return mm as Array<Record<string, unknown>>;
  return [];
}

function toTecdocModelOptions(models: Array<Record<string, unknown>>): TecdocModelOption[] {
  return models
    .map((m, i) => {
      const id = String(m.modelId ?? m.model_id ?? "").trim();
      if (!id) return null;
      const label = String(m.modelName ?? m.name ?? `Modelo ${i + 1}`);
      return { id, label, raw: m };
    })
    .filter((o): o is TecdocModelOption => o != null);
}

function buildEpcSession(
  vin: string,
  data: Record<string, unknown>,
): CatalogSession {
  return {
    mode: "epc",
    vin,
    epc: String(data.epc ?? ""),
    epcId: String(data.epc_id ?? ""),
    decodeRaw: data,
    tecdocVehicleId: null,
    tecdocVehicleLabel: null,
  };
}

async function resolveVinAfterPlate(vin: string): Promise<{
  vinDecode: VinDecodeResult | null;
  vinDecodeRaw: Record<string, unknown> | null;
  catalogSession: CatalogSession | null;
  tecdocPicklist: TecdocVehicleOption[] | null;
  tecdocModelPicklist: TecdocModelOption[] | null;
}> {
  const emptyTecdoc = {
    tecdocPicklist: null as TecdocVehicleOption[] | null,
    tecdocModelPicklist: null as TecdocModelOption[] | null,
  };

  const decoded = await remusa.vinDecode(vin);
  const vr = decoded.result;
  if (!vr) {
    return { vinDecode: null, vinDecodeRaw: null, catalogSession: null, ...emptyTecdoc };
  }

  const code = Number(vr.code);
  const data = vr.data as Record<string, unknown> | undefined;

  if (code === 1 && data && data.epc) {
    return {
      vinDecode: remusa.map17vinDecodeToUi(vr),
      vinDecodeRaw: data,
      catalogSession: buildEpcSession(vin, data),
      ...emptyTecdoc,
    };
  }

  try {
    const tc = await remusa.vinCheckTecdoc(vin);
    const result = tc.result as Record<string, unknown>;
    const vehicles = extractTecdocVehicles(result);
    const models = extractTecdocModels(result);
    const manufacturers = extractTecdocManufacturers(result);
    const manuName = manufacturers[0]
      ? String((manufacturers[0] as Record<string, unknown>).manuName ?? "TecDoc")
      : "TecDoc";

    if (vehicles.length > 1) {
      return {
        vinDecode: remusa.tecdocVehicleToVinDecode(vehicles[0], vin),
        vinDecodeRaw: data ?? null,
        catalogSession: null,
        tecdocPicklist: toTecdocOptions(vehicles),
        tecdocModelPicklist: null,
      };
    }
    if (vehicles.length === 1) {
      const v = vehicles[0];
      const id = String(v.vehicleId ?? v.vehicle_id ?? "");
      const label = String(v.carName ?? v.vehicleTypeDescription ?? "TecDoc");
      return {
        vinDecode: remusa.tecdocVehicleToVinDecode(v, vin),
        vinDecodeRaw: data ?? null,
        catalogSession: {
          mode: "tecdoc",
          vin,
          epc: "tecdoc",
          epcId: "",
          decodeRaw: data ?? null,
          tecdocVehicleId: id,
          tecdocVehicleLabel: label,
        },
        tecdocPicklist: null,
        tecdocModelPicklist: null,
      };
    }

    if (models.length > 1) {
      return {
        vinDecode: remusa.tecdocPendingModelVinDecode(manuName, vin),
        vinDecodeRaw: data ?? null,
        catalogSession: null,
        tecdocPicklist: null,
        tecdocModelPicklist: toTecdocModelOptions(models),
      };
    }

    if (models.length === 1) {
      const mid = String(
        (models[0] as Record<string, unknown>).modelId ??
          (models[0] as Record<string, unknown>).model_id ??
          "",
      ).trim();
      if (mid) {
        const mv = await remusa.tecdocListVehiclesForModel(mid);
        const vlist = mv.vehicles ?? [];
        if (vlist.length > 1) {
          return {
            vinDecode: remusa.tecdocVehicleToVinDecode(vlist[0], vin),
            vinDecodeRaw: data ?? null,
            catalogSession: null,
            tecdocPicklist: toTecdocOptions(vlist),
            tecdocModelPicklist: null,
          };
        }
        if (vlist.length === 1) {
          const v = vlist[0];
          const id = String(v.vehicleId ?? v.vehicle_id ?? "");
          const label = String(
            v.typeEngineName ?? v.carName ?? v.vehicleTypeDescription ?? "TecDoc",
          );
          return {
            vinDecode: remusa.tecdocVehicleToVinDecode(v, vin),
            vinDecodeRaw: data ?? null,
            catalogSession: {
              mode: "tecdoc",
              vin,
              epc: "tecdoc",
              epcId: "",
              decodeRaw: data ?? null,
              tecdocVehicleId: id,
              tecdocVehicleLabel: label,
            },
            tecdocPicklist: null,
            tecdocModelPicklist: null,
          };
        }
      }
    }
  } catch {
    /* fall through */
  }

  if (data && data.epc) {
    return {
      vinDecode: remusa.map17vinDecodeToUi(vr),
      vinDecodeRaw: data,
      catalogSession: buildEpcSession(vin, data),
      ...emptyTecdoc,
    };
  }

  return {
    vinDecode: data ? remusa.map17vinDecodeToUi(vr) : null,
    vinDecodeRaw: data ?? null,
    catalogSession: null,
    ...emptyTecdoc,
  };
}

async function searchPartsBackend(code: string): Promise<PartResult[]> {
  const q = code.trim();
  if (q.length < 2) {
    throw new Error("Ingrese al menos 2 caracteres.");
  }
  let results: Array<Record<string, unknown>>;
  if (q.length >= 3) {
    const r = await remusa.partsSearchFuzzy(q);
    results = r.results ?? [];
  } else {
    const r = await remusa.partsSearchExact(q);
    results = r.results ?? [];
  }
  return results.slice(0, 40).map((p, i) => remusa.mapPartRowToPartResult(p, q || String(i)));
}

export function useSearch() {
  const [state, setState] = useState<SearchState>({
    activeBlock: "plate",
    loading: false,
    loadingMessages: [],
    ...emptyStateBase(),
  });

  const toggleBlock = useCallback((mode: SearchMode) => {
    setState((prev) => ({
      ...prev,
      activeBlock: prev.activeBlock === mode ? null : mode,
    }));
  }, []);

  const resetResults = useCallback(() => {
    setState((prev) => ({
      ...prev,
      ...emptyStateBase(),
    }));
  }, []);

  const dismissPlateNotFoundToast = useCallback(() => {
    setState((prev) => ({ ...prev, plateNotFoundToast: false }));
  }, []);

  const selectTecdocVehicle = useCallback((option: TecdocVehicleOption) => {
    setState((prev) => {
      const vin = (prev.vehicleInfo?.vin || prev.lastVin || "").trim();
      const id = option.id;
      const vd = remusa.tecdocVehicleToVinDecode(option.raw, vin);
      return {
        ...prev,
        tecdocPicklist: null,
        tecdocModelPicklist: null,
        vinDecode: vd,
        catalogSession: {
          mode: "tecdoc",
          vin,
          epc: "tecdoc",
          epcId: "",
          decodeRaw: prev.vinDecodeRaw,
          tecdocVehicleId: id,
          tecdocVehicleLabel: option.label,
        },
      };
    });
  }, []);

  const selectTecdocModel = useCallback(async (option: TecdocModelOption) => {
    setState((prev) => ({
      ...prev,
      loading: true,
      loadingMessages: TECDOC_MODEL_MESSAGES,
      error: null,
    }));
    try {
      const mv = await remusa.tecdocListVehiclesForModel(option.id);
      const vlist = mv.vehicles ?? [];
      setState((prev) => {
        const vin = (prev.vehicleInfo?.vin || prev.lastVin || "").trim();
        if (vlist.length === 0) {
          return {
            ...prev,
            loading: false,
            loadingMessages: [],
            tecdocModelPicklist: null,
            error: "No se encontraron variantes TecDoc para este modelo.",
          };
        }
        if (vlist.length === 1) {
          const v = vlist[0];
          const id = String(v.vehicleId ?? v.vehicle_id ?? "");
          const label = String(
            v.typeEngineName ?? v.carName ?? v.vehicleTypeDescription ?? "TecDoc",
          );
          return {
            ...prev,
            loading: false,
            loadingMessages: [],
            tecdocModelPicklist: null,
            tecdocPicklist: null,
            vinDecode: remusa.tecdocVehicleToVinDecode(v, vin),
            catalogSession: {
              mode: "tecdoc",
              vin,
              epc: "tecdoc",
              epcId: "",
              decodeRaw: prev.vinDecodeRaw,
              tecdocVehicleId: id,
              tecdocVehicleLabel: label,
            },
          };
        }
        return {
          ...prev,
          loading: false,
          loadingMessages: [],
          tecdocModelPicklist: null,
          tecdocPicklist: toTecdocOptions(vlist),
          vinDecode: remusa.tecdocVehicleToVinDecode(vlist[0], vin),
        };
      });
    } catch (e) {
      setState((prev) => ({
        ...prev,
        loading: false,
        loadingMessages: [],
        error: e instanceof Error ? e.message : "Error TecDoc",
      }));
    }
  }, []);

  const handlePlateSearch = useCallback(async (plate: string) => {
    setState((prev) => ({
      ...prev,
      ...emptyStateBase(),
      activeBlock: "plate",
      loading: true,
      loadingMessages: PLATE_MESSAGES,
    }));

    if (isMockMode()) {
      try {
        const { vehicle, vinDecode } = await searchByPlate(plate);
        setState((prev) => ({
          ...prev,
          loading: false,
          loadingMessages: [],
          lastVin: vehicle.vin || null,
          vehicleInfo: vehicle,
          vinDecode,
          vinDecodeRaw: null,
          catalogSession:
            vinDecode?.epc && vinDecode.epc !== "tecdoc"
              ? {
                  mode: "epc",
                  vin: vehicle.vin,
                  epc: vinDecode.epc,
                  epcId: vinDecode.epcId,
                  decodeRaw: {},
                  tecdocVehicleId: null,
                  tecdocVehicleLabel: null,
                }
              : null,
          tecdocPicklist: null,
          tecdocModelPicklist: null,
        }));
      } catch {
        setState((prev) => ({
          ...prev,
          loading: false,
          loadingMessages: [],
          error: "Error al buscar placa. Intente de nuevo.",
        }));
      }
      return;
    }

    try {
      const { vehicle: raw } = await remusa.plateLookup(plate);
      const vehicle = remusa.mapRegcheckToVehicleInfo(raw as Record<string, unknown>);
      const vin = vehicle.vin?.trim() ?? "";

      if (!vin || vin.length < 10) {
        setState((prev) => ({
          ...prev,
          loading: false,
          loadingMessages: [],
          lastVin: vin || null,
          vehicleInfo: vehicle,
          vinDecode: null,
          vinDecodeRaw: null,
          catalogSession: null,
          tecdocPicklist: null,
          tecdocModelPicklist: null,
        }));
        return;
      }

      const resolved = await resolveVinAfterPlate(vin);
      setState((prev) => ({
        ...prev,
        loading: false,
        loadingMessages: [],
        lastVin: vin,
        vehicleInfo: vehicle,
        vinDecode: resolved.vinDecode,
        vinDecodeRaw: resolved.vinDecodeRaw,
        catalogSession: resolved.catalogSession,
        tecdocPicklist: resolved.tecdocPicklist,
        tecdocModelPicklist: resolved.tecdocModelPicklist,
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al buscar placa.";
      const isPlate404 =
        msg === PLATE_NOT_FOUND_MSG || msg.includes(PLATE_NOT_FOUND_MSG);
      setState((prev) => ({
        ...prev,
        loading: false,
        loadingMessages: [],
        error: isPlate404 ? null : msg,
        plateNotFoundToast: isPlate404,
      }));
    }
  }, []);

  const handleVinSearch = useCallback(async (vinRaw: string) => {
    const vin = vinRaw.trim().toUpperCase();
    setState((prev) => ({
      ...prev,
      ...emptyStateBase(),
      activeBlock: "vin",
      loading: true,
      loadingMessages: VIN_MESSAGES,
    }));

    if (vin.length !== 17) {
      setState((prev) => ({
        ...prev,
        loading: false,
        loadingMessages: [],
        error: "El VIN debe tener 17 caracteres.",
      }));
      return;
    }

    if (isMockMode()) {
      try {
        const { vinDecode } = await decodeVin(vin);
        setState((prev) => ({
          ...prev,
          loading: false,
          loadingMessages: [],
          lastVin: vin,
          vinDecode,
          vinDecodeRaw: null,
          catalogSession:
            vinDecode?.epc && vinDecode.epc !== "tecdoc"
              ? {
                  mode: "epc",
                  vin,
                  epc: vinDecode.epc,
                  epcId: vinDecode.epcId,
                  decodeRaw: {},
                  tecdocVehicleId: null,
                  tecdocVehicleLabel: null,
                }
              : null,
          tecdocPicklist: null,
          tecdocModelPicklist: null,
        }));
      } catch {
        setState((prev) => ({
          ...prev,
          loading: false,
          loadingMessages: [],
          error: "Error al decodificar VIN. Intente de nuevo.",
        }));
      }
      return;
    }

    try {
      const resolved = await resolveVinAfterPlate(vin);
      setState((prev) => ({
        ...prev,
        loading: false,
        loadingMessages: [],
        lastVin: vin,
        vehicleInfo: null,
        vinDecode: resolved.vinDecode,
        vinDecodeRaw: resolved.vinDecodeRaw,
        catalogSession: resolved.catalogSession,
        tecdocPicklist: resolved.tecdocPicklist,
        tecdocModelPicklist: resolved.tecdocModelPicklist,
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al decodificar VIN.";
      setState((prev) => ({
        ...prev,
        loading: false,
        loadingMessages: [],
        lastVin: vin,
        error: msg,
      }));
    }
  }, []);

  const handlePartSearch = useCallback(async (code: string) => {
    setState((prev) => ({
      ...prev,
      ...emptyStateBase(),
      activeBlock: "partCode",
      loading: true,
      loadingMessages: PART_MESSAGES,
    }));

    if (isMockMode()) {
      try {
        const { parts } = await searchByPartCode(code);
        setState((prev) => ({
          ...prev,
          loading: false,
          loadingMessages: [],
          partResults: parts,
        }));
      } catch {
        setState((prev) => ({
          ...prev,
          loading: false,
          loadingMessages: [],
          error: "Error al buscar pieza. Intente de nuevo.",
        }));
      }
      return;
    }

    try {
      let parts: PartResult[] = [];
      try {
        parts = await searchPartsBackend(code);
      } catch {
        /* 17VIN may return nothing — we still check REMUSA below */
      }

      const allPns = Array.from(new Set([
        code.trim(),
        ...parts.map((p) => p.partNumber),
      ])).filter(Boolean);

      let remusaMap: Record<string, { articulo: string; desc: string; source: string }> = {};
      let directRemusa: { articulo: string; desc: string; source: string } | null = null;

      try {
        if (allPns.length > 0) {
          const batch = await remusa.remusaBatchCheck(allPns);
          remusaMap = (batch.results as typeof remusaMap) ?? {};
        }
      } catch {
        /* batch check failed — continue without REMUSA data */
      }

      if (parts.length === 0) {
        try {
          const lr = await remusa.remusaLookup(code.trim());
          if (lr.found) {
            directRemusa = {
              articulo: String(lr.articulo ?? ""),
              desc: String(lr.desc ?? ""),
              source: String(lr.source ?? ""),
            };
          }
        } catch {
          /* REMUSA lookup failed */
        }
      }

      if (parts.length === 0 && !directRemusa) {
        setState((prev) => ({
          ...prev,
          loading: false,
          loadingMessages: [],
          error: "Sin resultados para este código.",
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        loadingMessages: [],
        partResults: parts,
        partRemusaMap: remusaMap,
        partDirectRemusa: directRemusa,
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al buscar pieza.";
      setState((prev) => ({
        ...prev,
        loading: false,
        loadingMessages: [],
        error: msg,
      }));
    }
  }, []);

  return {
    state,
    toggleBlock,
    handlePlateSearch,
    handleVinSearch,
    handlePartSearch,
    resetResults,
    selectTecdocVehicle,
    selectTecdocModel,
    dismissPlateNotFoundToast,
  } as const;
}
