import { useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import {
  HiOutlineIdentification,
  HiOutlineWrenchScrewdriver,
  HiOutlineArrowRightOnRectangle,
  HiOutlineUserCircle,
  HiChevronDown,
} from "react-icons/hi2";
import { PiBarcodeBold } from "react-icons/pi";
import { IoIosWifi } from "react-icons/io";
import { MdOutlineSignalCellularAlt } from "react-icons/md";
import { BsBatteryFull } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";
import SearchInput from "../components/search/SearchInput";
import TerminalLoader from "../components/search/TerminalLoader";
import ResultsDisplay from "../components/results/ResultsDisplay";
import { useSearch } from "../hooks/useSearch";
import type { LayoutOutletContext } from "../components/layout/Layout";
import type { SearchMode } from "../types";

const CARD_BRAND = "#75141C";
const CARD_BLUE = "#4A9ED1";
const CARD_DARK = "#212124";

const expandTransition = {
  height: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  opacity: { duration: 0.25 },
};

export default function MainPage() {
  const { openChat } = useOutletContext<LayoutOutletContext>();
  const {
    state,
    toggleBlock,
    handlePlateSearch,
    handleVinSearch,
    handlePartSearch,
  } = useSearch();

  const resultsRef = useRef<HTMLElement>(null);

  const hasDisplayData = Boolean(
    state.vehicleInfo || state.vinDecode || state.partResults.length > 0,
  );

  useEffect(() => {
    if (!hasDisplayData || !resultsRef.current) return;
    resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hasDisplayData, state.vehicleInfo, state.vinDecode, state.partResults]);

  const onCardClick = (mode: SearchMode) => {
    toggleBlock(mode);
  };

  const partOpen = state.activeBlock === "partCode";
  const vinOpen = state.activeBlock === "vin";

  const plateLoading = state.loading && state.activeBlock === "plate";

  /** Hide placa card while Parte or VIN block is selected */
  const showPlateBlock =
    state.activeBlock !== "partCode" && state.activeBlock !== "vin";

  return (
    <div className="flex flex-col min-h-full bg-[#0b0b0c] w-full min-w-0">
      <section className="bg-white rounded-b-[36px] sm:rounded-b-[40px] px-4 pt-3 pb-6 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.35)] lg:px-8 lg:pb-8">
        <div className="flex items-center justify-between text-[13px] font-semibold tracking-tight">
          <span className="text-[#75141C]">12:00</span>
          <span className="flex items-center gap-1.5 text-neutral-700">
            <MdOutlineSignalCellularAlt className="text-[15px]" />
            <IoIosWifi className="text-[16px]" />
            <BsBatteryFull className="text-[18px]" />
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={openChat}
            className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center text-[#75141C] transition-all duration-300 hover:bg-[#75141C]/10 hover:border-[#75141C]/35 hover:scale-105 active:scale-95"
            aria-label="Asistente"
          >
            <HiOutlineUserCircle className="text-2xl" />
          </button>
          <div className="flex min-w-0 flex-1 justify-center px-1">
            <img
              src="/logo.webp"
              alt="Remusa AI"
              className="h-10 w-auto max-h-14 max-w-[min(220px,52vw)] object-contain object-center lg:h-16"
              decoding="async"
            />
          </div>
          <button
            type="button"
            disabled
            className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-400 opacity-50 cursor-not-allowed"
            aria-label="Salir"
          >
            <HiOutlineArrowRightOnRectangle className="text-lg" />
          </button>
        </div>

        {!showPlateBlock && (
          <button
            type="button"
            onClick={() => toggleBlock("plate")}
            className="mt-6 w-full min-w-0 rounded-[28px] overflow-hidden shadow-[0_12px_32px_-16px_rgba(0,0,0,0.35)] text-left transition-transform duration-200 active:scale-[0.99] flex items-start justify-between gap-3 p-6 lg:p-7 text-white"
            style={{ backgroundColor: CARD_BRAND }}
            aria-label="Abrir busqueda por placa"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium text-white/95">
                <span className="opacity-90">•</span>
                <span>Placa</span>
              </div>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <HiOutlineIdentification className="text-2xl opacity-90 shrink-0" />
                <span className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Buscar por placa
                </span>
              </div>
              <p className="mt-2 text-sm text-white/85">Registro Costa Rica</p>
            </div>
            <span className="text-white/90 shrink-0 mt-1" aria-hidden>
              <HiChevronDown className="text-2xl" />
            </span>
          </button>
        )}

        <AnimatePresence initial={false}>
          {showPlateBlock && (
            <motion.div
              key="plate-card"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={expandTransition}
              className="overflow-hidden mt-6"
            >
              <div
                className="w-full min-w-0 rounded-[28px] overflow-hidden shadow-[0_12px_32px_-16px_rgba(0,0,0,0.35)]"
                style={{ backgroundColor: CARD_BRAND }}
              >
                <div className="p-6 lg:p-7 text-white">
                  <div className="flex items-center gap-2 text-sm font-medium text-white/95">
                    <span className="opacity-90">•</span>
                    <span>Placa</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <HiOutlineIdentification className="text-2xl sm:text-[28px] opacity-95 shrink-0" />
                    <span className="text-2xl sm:text-3xl font-bold tracking-tight">
                      Buscar por placa
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-white/85">
                    Registro Costa Rica
                  </p>
                </div>

                <div className="border-t border-white/25 px-5 pb-6 pt-4 lg:px-7 lg:pb-7 bg-black/15">
                  <p className="text-sm text-white/95 mb-3 leading-relaxed">
                    Ingrese la placa del vehiculo (ej. SCS-199). Se consultara
                    el Registro y se decodificara el VIN cuando este disponible.
                  </p>
                  <SearchInput
                    placeholder="Ej: SCS-199"
                    onSearch={handlePlateSearch}
                    loading={state.loading}
                    variant="dark"
                  />
                  <AnimatePresence>
                    {plateLoading && (
                      <TerminalLoader
                        messages={state.loadingMessages}
                        active
                        variant="dark"
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <div className="w-full min-w-0 px-3 pt-5 flex flex-col gap-3.5 flex-1 lg:px-8 lg:gap-4 lg:pt-6">
        <div
          className="w-full min-w-0 rounded-[28px] overflow-hidden shadow-[0_12px_32px_-16px_rgba(0,0,0,0.45)] transition-shadow duration-300"
          style={{ backgroundColor: CARD_BLUE }}
        >
          <button
            type="button"
            onClick={() => onCardClick("partCode")}
            className="w-full text-left p-6 lg:p-7 text-white flex items-start justify-between gap-3 transition-transform duration-200 active:scale-[0.99]"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium text-white/95">
                <span className="opacity-90">•</span>
                <span>Parte</span>
              </div>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <PiBarcodeBold className="text-2xl opacity-90 shrink-0" />
                <span className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Codigo de parte
                </span>
              </div>
              <p className="mt-2 text-sm text-white/85">OEM o alterno</p>
            </div>
            <motion.span
              animate={{ rotate: partOpen ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="text-white/90 shrink-0 mt-1"
            >
              <HiChevronDown className="text-2xl" />
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {partOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={expandTransition}
                className="overflow-hidden border-t border-white/25"
              >
                <div className="px-5 pb-6 pt-4 lg:px-7 lg:pb-7 bg-black/15">
                  <p className="text-sm text-white/95 mb-3 leading-relaxed">
                    Escribe el codigo de pieza para buscar en el catalogo EPC
                    (coincidencia exacta o smart).
                  </p>
                  <SearchInput
                    placeholder="Ej: 04465-42180"
                    onSearch={handlePartSearch}
                    loading={state.loading}
                    variant="dark"
                  />
                  <AnimatePresence>
                    {state.loading &&
                      partOpen &&
                      state.activeBlock === "partCode" && (
                        <TerminalLoader
                          messages={state.loadingMessages}
                          active
                          variant="dark"
                        />
                      )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div
          className="w-full min-w-0 rounded-[28px] overflow-hidden shadow-[0_12px_32px_-16px_rgba(0,0,0,0.45)] transition-shadow duration-300"
          style={{ backgroundColor: CARD_DARK }}
        >
          <button
            type="button"
            onClick={() => onCardClick("vin")}
            className="w-full text-left p-6 lg:p-7 text-white flex items-start justify-between gap-3 transition-transform duration-200 active:scale-[0.99]"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium text-white/95">
                <span className="opacity-90">•</span>
                <span>VIN</span>
              </div>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <HiOutlineWrenchScrewdriver className="text-2xl opacity-90 shrink-0" />
                <span className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Numero VIN
                </span>
              </div>
              <p className="mt-2 text-sm text-white/85">17 caracteres</p>
            </div>
            <motion.span
              animate={{ rotate: vinOpen ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="text-white/90 shrink-0 mt-1"
            >
              <HiChevronDown className="text-2xl" />
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {vinOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={expandTransition}
                className="overflow-hidden border-t border-white/15"
              >
                <div className="px-5 pb-6 pt-4 lg:px-7 lg:pb-7 bg-black/25">
                  <p className="text-sm text-white/90 mb-3 leading-relaxed">
                    Escribe el VIN de 17 caracteres para obtener EPC, modelo,
                    motor y datos de fabricacion (17VIN).
                  </p>
                  <SearchInput
                    placeholder="VIN (17 caracteres)"
                    onSearch={handleVinSearch}
                    loading={state.loading}
                    variant="dark"
                  />
                  <AnimatePresence>
                    {state.loading &&
                      vinOpen &&
                      state.activeBlock === "vin" && (
                        <TerminalLoader
                          messages={state.loadingMessages}
                          active
                          variant="dark"
                        />
                      )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {state.error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl bg-red-500/15 border border-red-500/25 text-red-300 text-sm px-4 py-3"
            >
              {state.error}
            </motion.div>
          )}
        </AnimatePresence>

        <section
          ref={resultsRef}
          className="w-full min-w-0 rounded-[28px] border border-neutral-200/80 bg-[#ececf0] p-4 lg:p-6 mb-6 lg:mb-10 scroll-mt-4 shadow-inner"
        >
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Resultados
          </p>
          <div className="mt-3">
            {!hasDisplayData ? (
              <p className="text-sm text-neutral-500 text-center py-10 px-2">
                Busca por placa, codigo de parte o VIN para ver la informacion
                aqui.
              </p>
            ) : (
              <ResultsDisplay
                vehicleInfo={state.vehicleInfo}
                vinDecode={state.vinDecode}
                partResults={state.partResults}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
