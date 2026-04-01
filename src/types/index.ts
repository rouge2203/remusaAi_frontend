export interface VehicleInfo {
  description: string;
  carMake: string;
  carModel: string;
  registrationYear: string;
  engineSize: string;
  body: string;
  fuel: string;
  wheelPlan: string;
  colour: string;
  vin: string;
  engineCode: string;
  owner?: string;
  imageUrl?: string;
}

export interface VinModel {
  brand: string;
  model: string;
  cc: string;
  engine: string;
  transmission: string;
  drive: string;
  year: string;
  series: string;
  factory: string;
  bodyType: string;
}

export interface VinDecodeResult {
  epc: string;
  epcId: string;
  brand: string;
  modelYear: string;
  buildDate: string;
  madeIn: string;
  matchingMode: string;
  models: VinModel[];
}

export interface PartResult {
  partNumber: string;
  partNameEn: string;
  partNameZh: string;
  brandNameEn: string;
  brandNameZh: string;
  epc: string;
  groupId: string;
  partImg?: string;
  remusaMatch?: boolean;
}

export type SearchMode = 'plate' | 'partCode' | 'vin';

export interface SearchState {
  activeBlock: SearchMode | null;
  loading: boolean;
  loadingMessages: string[];
  vehicleInfo: VehicleInfo | null;
  vinDecode: VinDecodeResult | null;
  partResults: PartResult[];
  error: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
