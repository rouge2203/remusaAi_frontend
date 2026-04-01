import type { ReactNode } from "react";
import type { VehicleInfo, VinDecodeResult, PartResult } from "../../types";
import VehicleInfoCard from "./VehicleInfoCard";
import VinDecodeCard from "./VinDecodeCard";
import PartCard from "./PartCard";
import TerminalMenu from "../menu/TerminalMenu";
import {
  MENU_CATALOG_EPC,
  MENU_PART_DETAIL,
  MENU_TECDOC_FALLBACK,
} from "../../constants/remusaMenu";

interface ResultsDisplayProps {
  vehicleInfo: VehicleInfo | null;
  vinDecode: VinDecodeResult | null;
  partResults: PartResult[];
}

export default function ResultsDisplay({ vehicleInfo, vinDecode, partResults }: ResultsDisplayProps) {
  const hasResults = vehicleInfo || vinDecode || partResults.length > 0;
  if (!hasResults) return null;

  const blocks: ReactNode[] = [];
  let anim = 0;

  const epc = vinDecode?.epc?.trim();

  if (vinDecode && epc) {
    blocks.push(
      <TerminalMenu key="menu-epc" title="catalogo epc (17vin)" items={MENU_CATALOG_EPC} />,
    );
  } else if (vehicleInfo && vinDecode && !epc) {
    blocks.push(
      <TerminalMenu
        key="menu-tecdoc"
        title="catalogo tecdoc (respaldo)"
        items={MENU_TECDOC_FALLBACK}
      />,
    );
  } else if (vehicleInfo && !vinDecode) {
    blocks.push(
      <TerminalMenu
        key="menu-tecdoc"
        title="catalogo tecdoc (respaldo)"
        items={MENU_TECDOC_FALLBACK}
      />,
    );
  } else if (partResults.length > 0 && !vehicleInfo && !vinDecode) {
    blocks.push(
      <TerminalMenu key="menu-part" title="pieza seleccionada" items={MENU_PART_DETAIL} />,
    );
  }

  if (vehicleInfo) {
    blocks.push(<VehicleInfoCard key="veh" vehicle={vehicleInfo} index={anim++} />);
  }
  if (vinDecode) {
    blocks.push(<VinDecodeCard key="vin" vinDecode={vinDecode} index={anim++} />);
  }
  partResults.forEach((part, i) => {
    blocks.push(<PartCard key={`${part.partNumber}-${i}`} part={part} index={anim++} />);
  });

  return <div className="flex flex-col gap-4">{blocks}</div>;
}
