import md5 from "md5";
import type { PartResult, VehicleInfo, VinDecodeResult } from "../types";

/** Real APIs by default. Set `VITE_USE_MOCK=true` only for offline/demo without credentials. */
const useMock = import.meta.env.VITE_USE_MOCK === "true";

const API_17VIN_BASE = "/proxy17vin";
const API_REGCHECK_BASE = "/proxyRegcheck";
const API_RAPIDAPI_BASE = "/proxyRapidapi";

const user17Vin = import.meta.env.VITE_17VIN_USER ?? "";
const pass17Vin = import.meta.env.VITE_17VIN_PASSWORD ?? "";
const plateUser = import.meta.env.VITE_PLATE_USER ?? "";
const rapidApiKey = import.meta.env.VITE_RAPIDAPI_KEY ?? "";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizePart(value: string) {
  return value.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

function imageUrlFromPart(epc: string, partImg?: string) {
  if (!partImg) return undefined;
  if (partImg.startsWith("http")) return partImg;
  if (partImg.includes("/")) return `http://resource.17vin.com/img/${partImg}`;
  return `http://resource.17vin.com/img/${epc}/${partImg}`;
}

function make17VinToken(urlParams: string) {
  if (!user17Vin || !pass17Vin) {
    throw new Error("Missing VITE_17VIN_USER or VITE_17VIN_PASSWORD.");
  }
  const md5User = md5(user17Vin);
  const md5Pass = md5(pass17Vin);
  return md5(`${md5User}${md5Pass}${urlParams}`);
}

async function api17vinGet<T>(urlParams: string): Promise<T> {
  const sep = urlParams.includes("?") ? "&" : "?";
  const token = make17VinToken(urlParams);
  const fullPath = `${urlParams}${sep}user=${encodeURIComponent(user17Vin)}&token=${token}`;
  const res = await fetch(`${API_17VIN_BASE}${fullPath}`);
  if (!res.ok) {
    throw new Error(`17VIN request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

async function lookupPlateReal(plate: string): Promise<Record<string, unknown>> {
  if (!plateUser) {
    throw new Error("Missing VITE_PLATE_USER in frontend .env");
  }

  const params = new URLSearchParams({
    RegistrationNumber: plate,
    username: plateUser,
  });
  const res = await fetch(`${API_REGCHECK_BASE}/api/reg.asmx/CheckCostaRica?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Plate lookup failed (${res.status})`);
  }
  const text = await res.text();
  const match = text.match(/<vehicleJson>\s*(\{.*?\})\s*<\/vehicleJson>/s);
  if (!match?.[1]) {
    throw new Error("No vehicleJson found for this plate.");
  }
  return JSON.parse(match[1]) as Record<string, unknown>;
}

function mapPlateToVehicleInfo(plateRaw: Record<string, unknown>): VehicleInfo {
  return {
    description: String(plateRaw.Description ?? ""),
    carMake: String(plateRaw.CarMake ?? ""),
    carModel: String(plateRaw.CarModel ?? ""),
    registrationYear: String(plateRaw.RegistrationYear ?? ""),
    engineSize: String(plateRaw.EngineSize ?? ""),
    body: String(plateRaw.Body ?? ""),
    fuel: String(plateRaw.Fuel ?? ""),
    wheelPlan: String(plateRaw.WheelPlan ?? ""),
    colour: String(plateRaw.Colour ?? ""),
    vin: String(plateRaw.VIN ?? ""),
    engineCode: String(plateRaw.EngineCode ?? ""),
    owner: String(plateRaw.owner ?? ""),
    imageUrl: plateRaw.ImageUrl ? String(plateRaw.ImageUrl) : undefined,
  };
}

function map17vinDecodeToUi(raw: Record<string, unknown>): VinDecodeResult {
  const data = (raw.data as Record<string, unknown>) ?? {};
  const modelList = (data.model_list as Array<Record<string, unknown>>) ?? [];
  const first = modelList[0] ?? {};
  return {
    epc: String(data.epc ?? ""),
    epcId: String(data.epc_id ?? ""),
    brand: String(data.brand ?? ""),
    modelYear: String(data.model_year_from_vin ?? ""),
    buildDate: String(data.build_date ?? ""),
    madeIn: String(data.made_in_en ?? data.made_in_cn ?? ""),
    matchingMode: String(data.matching_mode ?? ""),
    models: modelList.slice(0, 3).map((m) => ({
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

async function tecdocVinFallback(vin: string): Promise<VinDecodeResult | null> {
  if (!rapidApiKey) return null;

  const res = await fetch(`${API_RAPIDAPI_BASE}/vin/tecdoc-vin-check/${encodeURIComponent(vin)}`, {
    headers: {
      "x-rapidapi-host": "tecdoc-catalog.p.rapidapi.com",
      "x-rapidapi-key": rapidApiKey,
    },
  });
  if (!res.ok) return null;

  const payload = (await res.json()) as { data?: { vehicles?: Array<Record<string, unknown>> } };
  const vehicle = payload?.data?.vehicles?.[0];
  if (!vehicle) return null;

  return {
    epc: "tecdoc",
    epcId: String(vehicle.vehicle_id ?? ""),
    brand: String(vehicle.make ?? vehicle.brand ?? "TecDoc"),
    modelYear: String(vehicle.year ?? ""),
    buildDate: "",
    madeIn: String(vehicle.country ?? ""),
    matchingMode: "TecDoc VIN",
    models: [
      {
        brand: String(vehicle.make ?? vehicle.brand ?? "TecDoc"),
        model: String(vehicle.model ?? ""),
        cc: String(vehicle.ccm ?? ""),
        engine: String(vehicle.engine_code ?? vehicle.engine ?? ""),
        transmission: String(vehicle.transmission ?? ""),
        drive: String(vehicle.drive_type ?? ""),
        year: String(vehicle.year ?? ""),
        series: String(vehicle.series ?? ""),
        factory: "",
        bodyType: String(vehicle.body_type ?? ""),
      },
    ],
  };
}

function mockPlatePayload(plate: string): VehicleInfo {
  return {
    description: `${plate.toUpperCase()} - Toyota RAV4 2019`,
    carMake: "Toyota",
    carModel: "RAV4 Hybrid XLE",
    registrationYear: "2019",
    engineSize: "2487 cc",
    body: "SUV 5 Puertas",
    fuel: "Hibrido (Gasolina/Electrico)",
    wheelPlan: "4x4",
    colour: "Gris Metalico",
    vin: "JTMRWRFV5KD038742",
    engineCode: "A25A-FXS",
    owner: "VEHICULO REGISTRADO CR",
    imageUrl: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=250&fit=crop",
  };
}

export function isMockMode() {
  return useMock;
}

export async function searchByPlate(plate: string): Promise<{ vehicle: VehicleInfo; vinDecode: VinDecodeResult | null }> {
  if (useMock) {
    await delay(900);
    return {
      vehicle: mockPlatePayload(plate),
      vinDecode: await decodeVin("JTMRWRFV5KD038742").then((r) => r.vinDecode),
    };
  }

  const plateRaw = await lookupPlateReal(plate);
  const vehicle = mapPlateToVehicleInfo(plateRaw);
  let vinDecode: VinDecodeResult | null = null;

  if (vehicle.vin?.length >= 10) {
    try {
      const decoded = await decodeVin(vehicle.vin);
      vinDecode = decoded.vinDecode;
    } catch {
      vinDecode = await tecdocVinFallback(vehicle.vin);
    }
  }

  return { vehicle, vinDecode };
}

export async function decodeVin(vin: string): Promise<{ vinDecode: VinDecodeResult }> {
  if (useMock) {
    await delay(900);
    return {
      vinDecode: {
        epc: "toyota",
        epcId: "toyota_201",
        brand: "Toyota",
        modelYear: "2020",
        buildDate: "2019-09",
        madeIn: "Estados Unidos",
        matchingMode: "VIN Exact",
        models: [
          {
            brand: "Toyota",
            model: "Camry SE",
            cc: "2494",
            engine: "A25A-FKS 2.5L Dynamic Force",
            transmission: "8-Speed Direct Shift",
            drive: "FWD",
            year: "2020",
            series: "ASV70L",
            factory: "Georgetown, KY, USA",
            bodyType: "Sedan",
          },
        ],
      },
    };
  }

  const res = await api17vinGet<{ code?: number; data?: Record<string, unknown> }>(`/?vin=${encodeURIComponent(vin)}`);
  if (res?.code === 1 && res.data) {
    return { vinDecode: map17vinDecodeToUi(res as unknown as Record<string, unknown>) };
  }

  const tecdoc = await tecdocVinFallback(vin);
  if (tecdoc) return { vinDecode: tecdoc };
  throw new Error("VIN lookup failed in both 17VIN and TecDoc.");
}

export async function searchByPartCode(code: string): Promise<{ parts: PartResult[] }> {
  if (useMock) {
    await delay(700);
    return {
      parts: [
        {
          partNumber: code.toUpperCase(),
          partNameEn: "Brake Pad Kit, Front",
          partNameZh: "前制动片套件",
          brandNameEn: "Toyota",
          brandNameZh: "トヨタ",
          epc: "toyota",
          groupId: "BRK-001",
          partImg: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=200&fit=crop",
          remusaMatch: true,
        },
      ],
    };
  }

  const normalized = normalizePart(code);
  const data = await api17vinGet<{ code?: number; data?: Array<Record<string, unknown>> }>(
    `/?action=search_epc&query_part_number=${encodeURIComponent(normalized)}&query_match_type=smart`,
  );
  if (data.code !== 1 || !Array.isArray(data.data)) {
    throw new Error("Part search returned no results.");
  }

  const parts = data.data.slice(0, 20).map((p) => ({
    partNumber: String(p.Partnumber ?? normalized),
    partNameEn: String(p.Part_name_en ?? ""),
    partNameZh: String(p.Part_name_zh ?? ""),
    brandNameEn: String(p.Brand_name_en ?? ""),
    brandNameZh: String(p.Brand_name_zh ?? ""),
    epc: String(p.Epc ?? ""),
    groupId: String(p.Group_id ?? ""),
    partImg: imageUrlFromPart(String(p.Epc ?? ""), p.Part_img ? String(p.Part_img) : undefined),
    remusaMatch: false,
  }));
  return { parts };
}
