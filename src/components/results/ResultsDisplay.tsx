import type { ReactNode } from "react";
import type {
  VehicleInfo,
  VinDecodeResult,
  PartResult,
  RemusaHit,
  CatalogSession,
  TecdocVehicleOption,
  TecdocModelOption,
} from "../../types";
import VehicleInfoCard from "./VehicleInfoCard";
import VinDecodeCard from "./VinDecodeCard";
import TecdocModelPicker from "../catalog/TecdocModelPicker";
import TecdocVehiclePicker from "../catalog/TecdocVehiclePicker";
import EpcCatalogHub from "../catalog/EpcCatalogHub";
import TecdocCatalogHub from "../catalog/TecdocCatalogHub";
import PartSearchResultsHub from "../catalog/PartSearchResultsHub";

interface ResultsDisplayProps {
  vehicleInfo: VehicleInfo | null;
  vinDecode: VinDecodeResult | null;
  vinDecodeRaw: Record<string, unknown> | null;
  partResults: PartResult[];
  partRemusaMap: Record<string, RemusaHit>;
  partDirectRemusa: RemusaHit | null;
  catalogSession: CatalogSession | null;
  tecdocModelPicklist: TecdocModelOption[] | null;
  tecdocPicklist: TecdocVehicleOption[] | null;
  onResetCatalog: () => void;
  onSelectTecdocModel: (o: TecdocModelOption) => void | Promise<void>;
  onSelectTecdocVehicle: (o: TecdocVehicleOption) => void;
}

export default function ResultsDisplay({
  vehicleInfo,
  vinDecode,
  vinDecodeRaw,
  partResults,
  partRemusaMap,
  partDirectRemusa,
  catalogSession,
  tecdocModelPicklist,
  tecdocPicklist,
  onResetCatalog,
  onSelectTecdocModel,
  onSelectTecdocVehicle,
}: ResultsDisplayProps) {
  const hasPartData = partResults.length > 0 || partDirectRemusa != null;
  const hasResults = vehicleInfo || vinDecode || hasPartData;
  if (!hasResults && !catalogSession && !tecdocPicklist?.length && !tecdocModelPicklist?.length)
    return null;

  const blocks: ReactNode[] = [];
  let anim = 0;

  if (vehicleInfo) {
    blocks.push(<VehicleInfoCard key="veh" vehicle={vehicleInfo} index={anim++} />);
  }
  if (vinDecode) {
    blocks.push(
      <VinDecodeCard
        key="vin"
        vinDecode={vinDecode}
        decodeData={vinDecodeRaw}
        index={anim++}
      />,
    );
  }

  if (tecdocModelPicklist && tecdocModelPicklist.length > 0) {
    blocks.push(
      <TecdocModelPicker
        key="td-models"
        options={tecdocModelPicklist}
        onSelect={(o) => void onSelectTecdocModel(o)}
      />,
    );
  }
  if (tecdocPicklist && tecdocPicklist.length > 0) {
    blocks.push(
      <TecdocVehiclePicker key="td-pick" options={tecdocPicklist} onSelect={onSelectTecdocVehicle} />,
    );
  }

  if (catalogSession?.mode === "epc" && catalogSession.epc) {
    blocks.push(
      <EpcCatalogHub key="epc-hub" session={catalogSession} onBack={onResetCatalog} />,
    );
  }

  if (catalogSession?.mode === "tecdoc" && catalogSession.tecdocVehicleId) {
    blocks.push(
      <TecdocCatalogHub key="td-hub" session={catalogSession} onBack={onResetCatalog} />,
    );
  }

  if (hasPartData) {
    blocks.push(
      <PartSearchResultsHub
        key="part-hub"
        parts={partResults}
        remusaMap={partRemusaMap}
        directRemusa={partDirectRemusa}
      />,
    );
  }

  return <div className="flex flex-col gap-4">{blocks}</div>;
}
