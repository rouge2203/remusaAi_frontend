import type { VehicleInfo, VinDecodeResult, PartResult } from '../../types'
import VehicleInfoCard from './VehicleInfoCard'
import VinDecodeCard from './VinDecodeCard'
import PartCard from './PartCard'

interface ResultsDisplayProps {
  vehicleInfo: VehicleInfo | null;
  vinDecode: VinDecodeResult | null;
  partResults: PartResult[];
}

export default function ResultsDisplay({ vehicleInfo, vinDecode, partResults }: ResultsDisplayProps) {
  const hasResults = vehicleInfo || vinDecode || partResults.length > 0;

  if (!hasResults) return null;

  return (
    <div className="mt-5 flex flex-col gap-4">
      {vehicleInfo && <VehicleInfoCard vehicle={vehicleInfo} index={0} />}
      {vinDecode && <VinDecodeCard vinDecode={vinDecode} index={1} />}
      {partResults.map((part, i) => (
        <PartCard key={`${part.partNumber}-${i}`} part={part} index={i + 2} />
      ))}
    </div>
  );
}
