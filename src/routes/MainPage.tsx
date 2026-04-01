import { HiOutlineIdentification, HiOutlineWrenchScrewdriver } from 'react-icons/hi2'
import { PiBarcodeBold } from 'react-icons/pi'
import { motion, AnimatePresence } from 'framer-motion'
import SearchBlock from '../components/search/SearchBlock'
import SearchInput from '../components/search/SearchInput'
import TerminalLoader from '../components/search/TerminalLoader'
import ResultsDisplay from '../components/results/ResultsDisplay'
import { useSearch } from '../hooks/useSearch'

export default function MainPage() {
  const {
    state,
    toggleBlock,
    handlePlateSearch,
    handleVinSearch,
    handlePartSearch,
  } = useSearch();

  return (
    <div className="flex flex-col gap-3">
      <SearchBlock
        title="Buscar por placa"
        icon={<HiOutlineIdentification />}
        isOpen={state.activeBlock === 'plate'}
        onToggle={() => toggleBlock('plate')}
      >
        <SearchInput
          placeholder="Ej: SCS-199"
          onSearch={handlePlateSearch}
          loading={state.loading}
        />
        <AnimatePresence>
          {state.loading && state.activeBlock === 'plate' && (
            <TerminalLoader messages={state.loadingMessages} active />
          )}
        </AnimatePresence>
      </SearchBlock>

      <SearchBlock
        title="Buscar por código de parte"
        icon={<PiBarcodeBold />}
        isOpen={state.activeBlock === 'partCode'}
        onToggle={() => toggleBlock('partCode')}
      >
        <SearchInput
          placeholder="Ej: 04465-42180"
          onSearch={handlePartSearch}
          loading={state.loading}
        />
        <AnimatePresence>
          {state.loading && state.activeBlock === 'partCode' && (
            <TerminalLoader messages={state.loadingMessages} active />
          )}
        </AnimatePresence>
      </SearchBlock>

      <SearchBlock
        title="Buscar por número de VIN"
        icon={<HiOutlineWrenchScrewdriver />}
        isOpen={state.activeBlock === 'vin'}
        onToggle={() => toggleBlock('vin')}
      >
        <SearchInput
          placeholder="VIN (17 dígitos)"
          onSearch={handleVinSearch}
          loading={state.loading}
        />
        <AnimatePresence>
          {state.loading && state.activeBlock === 'vin' && (
            <TerminalLoader messages={state.loadingMessages} active />
          )}
        </AnimatePresence>
      </SearchBlock>

      <AnimatePresence>
        {state.error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mt-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
          >
            {state.error}
          </motion.div>
        )}
      </AnimatePresence>

      <ResultsDisplay
        vehicleInfo={state.vehicleInfo}
        vinDecode={state.vinDecode}
        partResults={state.partResults}
      />
    </div>
  );
}
