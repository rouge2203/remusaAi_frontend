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
  /** Model specification string from 17VIN model_list (Model_detail / Model_en). */
  modelSpecification: string;
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

/** Active catalog context (EPC 17VIN or TecDoc fallback). */
export interface CatalogSession {
  mode: 'epc' | 'tecdoc';
  vin: string;
  epc: string;
  epcId: string;
  decodeRaw: Record<string, unknown> | null;
  tecdocVehicleId: string | null;
  tecdocVehicleLabel: string | null;
}

export interface TecdocVehicleOption {
  id: string;
  label: string;
  raw: Record<string, unknown>;
}

/** TecDoc modelId row when VIN matched model but not exact vehicle (list-vehicles next). */
export interface TecdocModelOption {
  id: string;
  label: string;
  raw: Record<string, unknown>;
}

export interface RemusaHit {
  articulo: string;
  desc: string;
  source: string;
}

export interface SearchState {
  activeBlock: SearchMode | null;
  loading: boolean;
  loadingMessages: string[];
  /** Last VIN used for plate/VIN search (needed for TecDoc picker when vehicleInfo is null). */
  lastVin: string | null;
  vehicleInfo: VehicleInfo | null;
  vinDecode: VinDecodeResult | null;
  /** Raw 17VIN `data` object when decode returns usable payload (option codes). */
  vinDecodeRaw: Record<string, unknown> | null;
  partResults: PartResult[];
  error: string | null;
  /** Toast for plate 404 (not duplicated in inline error). */
  plateNotFoundToast: boolean;
  catalogSession: CatalogSession | null;
  /** Multiple TecDoc vehicle variants — user must pick one. */
  tecdocPicklist: TecdocVehicleOption[] | null;
  /** TecDoc matched model but no vehicle — pick model then load variants. */
  tecdocModelPicklist: TecdocModelOption[] | null;
  /** REMUSA batch-check results keyed by part number (from part code search). */
  partRemusaMap: Record<string, RemusaHit>;
  /** Direct REMUSA match when 17VIN returned no results but the code exists in REMUSA. */
  partDirectRemusa: RemusaHit | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
