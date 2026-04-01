import type { VehicleInfo, VinDecodeResult, PartResult } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function searchByPlate(plate: string): Promise<{
  vehicle: VehicleInfo;
  vinDecode: VinDecodeResult | null;
}> {
  await delay(2500);

  const vehicle: VehicleInfo = {
    description: `${plate.toUpperCase()} - Toyota RAV4 2019`,
    carMake: 'Toyota',
    carModel: 'RAV4 Hybrid XLE',
    registrationYear: '2019',
    engineSize: '2487 cc',
    body: 'SUV 5 Puertas',
    fuel: 'Hibrido (Gasolina/Electrico)',
    wheelPlan: '4x4',
    colour: 'Gris Metalico',
    vin: 'JTMRWRFV5KD038742',
    engineCode: 'A25A-FXS',
    owner: 'VEHICULO REGISTRADO CR',
    imageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=250&fit=crop',
  };

  await delay(1500);

  const vinDecode: VinDecodeResult = {
    epc: 'toyota',
    epcId: 'toyota_201',
    brand: 'Toyota',
    modelYear: '2019',
    buildDate: '2018-11',
    madeIn: 'Japon',
    matchingMode: 'VIN Exact',
    models: [
      {
        brand: 'Toyota',
        model: 'RAV4 Hybrid',
        cc: '2487',
        engine: 'A25A-FXS 2.5L Hybrid',
        transmission: 'CVT (ECVT)',
        drive: 'AWD (E-Four)',
        year: '2019',
        series: 'AXAH54L',
        factory: 'Tahara Plant, Japan',
        bodyType: 'SUV',
      },
    ],
  };

  return { vehicle, vinDecode };
}

export async function decodeVin(vin: string): Promise<{
  vinDecode: VinDecodeResult;
}> {
  await delay(3000);

  return {
    vinDecode: {
      epc: 'toyota',
      epcId: 'toyota_201',
      brand: 'Toyota',
      modelYear: '2020',
      buildDate: '2019-09',
      madeIn: 'Estados Unidos',
      matchingMode: 'VIN Exact',
      models: [
        {
          brand: 'Toyota',
          model: 'Camry SE',
          cc: '2494',
          engine: 'A25A-FKS 2.5L Dynamic Force',
          transmission: '8-Speed Direct Shift',
          drive: 'FWD',
          year: '2020',
          series: 'ASV70L',
          factory: 'Georgetown, KY, USA',
          bodyType: 'Sedan',
        },
      ],
    },
  };
}

export async function searchByPartCode(code: string): Promise<{
  parts: PartResult[];
}> {
  await delay(2000);

  return {
    parts: [
      {
        partNumber: code.toUpperCase(),
        partNameEn: 'Brake Pad Kit, Front',
        partNameZh: '前制动片套件',
        brandNameEn: 'Toyota',
        brandNameZh: 'トヨタ',
        epc: 'toyota',
        groupId: 'BRK-001',
        partImg: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=200&fit=crop',
        remusaMatch: true,
      },
      {
        partNumber: `${code.toUpperCase()}-ALT`,
        partNameEn: 'Brake Pad Kit, Front (Aftermarket)',
        partNameZh: '前制动片套件 (副厂)',
        brandNameEn: 'Akebono',
        brandNameZh: 'アケボノ',
        epc: 'aftermarket',
        groupId: 'BRK-002',
        remusaMatch: false,
      },
    ],
  };
}
