/**
 * Offline / demo mock APIs only. Real traffic uses Django via `remusaApi` + `useSearch`.
 */
import type { PartResult, VehicleInfo, VinDecodeResult } from "../types";

const useMock = import.meta.env.VITE_USE_MOCK === "true";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  if (!useMock) {
    throw new Error("searchByPlate mock: set VITE_USE_MOCK=true or use backend flow.");
  }
  await delay(900);
  return {
    vehicle: mockPlatePayload(plate),
    vinDecode: await decodeVin("JTMRWRFV5KD038742").then((r) => r.vinDecode),
  };
}

export async function decodeVin(_vin: string): Promise<{ vinDecode: VinDecodeResult }> {
  if (!useMock) {
    throw new Error("decodeVin mock: set VITE_USE_MOCK=true or use backend flow.");
  }
  await delay(900);
  return {
    vinDecode: {
      epc: "toyota",
      epcId: "toyota_201",
      brand: "Toyota",
      modelSpecification: "Camry SE · Sedan",
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

export async function searchByPartCode(code: string): Promise<{ parts: PartResult[] }> {
  if (!useMock) {
    throw new Error("searchByPartCode mock: set VITE_USE_MOCK=true or use backend flow.");
  }
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
