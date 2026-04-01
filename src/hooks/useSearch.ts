import { useState, useCallback } from 'react'
import type { SearchState, SearchMode, VehicleInfo, VinDecodeResult, PartResult } from '../types'
import { searchByPlate, decodeVin, searchByPartCode } from '../lib/api'

const PLATE_MESSAGES = [
  'Conectando con registro vehicular...',
  'Consultando placa en Costa Rica...',
  'Vehículo encontrado, extrayendo datos...',
  'Decodificando VIN...',
  'Consultando catálogo EPC...',
  'Listo.',
];

const VIN_MESSAGES = [
  'Validando formato VIN...',
  'Consultando base de datos 17VIN...',
  'Decodificando información del vehículo...',
  'Identificando modelo y motor...',
  'Listo.',
];

const PART_MESSAGES = [
  'Buscando código de parte...',
  'Consultando catálogos EPC...',
  'Verificando disponibilidad REMUSA...',
  'Listo.',
];

export function useSearch() {
  const [state, setState] = useState<SearchState>({
    activeBlock: null,
    loading: false,
    loadingMessages: [],
    vehicleInfo: null,
    vinDecode: null,
    partResults: [],
    error: null,
  });

  const toggleBlock = useCallback((mode: SearchMode) => {
    setState(prev => ({
      ...prev,
      activeBlock: prev.activeBlock === mode ? null : mode,
    }));
  }, []);

  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      vehicleInfo: null,
      vinDecode: null,
      partResults: [],
      error: null,
    }));
  }, []);

  const handlePlateSearch = useCallback(async (plate: string) => {
    clearResults();
    setState(prev => ({ ...prev, loading: true, loadingMessages: PLATE_MESSAGES, error: null }));

    try {
      const { vehicle, vinDecode } = await searchByPlate(plate);
      setState(prev => ({
        ...prev,
        loading: false,
        loadingMessages: [],
        vehicleInfo: vehicle,
        vinDecode: vinDecode,
      }));
    } catch {
      setState(prev => ({
        ...prev,
        loading: false,
        loadingMessages: [],
        error: 'Error al buscar placa. Intente de nuevo.',
      }));
    }
  }, [clearResults]);

  const handleVinSearch = useCallback(async (vin: string) => {
    clearResults();
    setState(prev => ({ ...prev, loading: true, loadingMessages: VIN_MESSAGES, error: null }));

    try {
      const { vinDecode } = await decodeVin(vin);
      setState(prev => ({
        ...prev,
        loading: false,
        loadingMessages: [],
        vinDecode,
      }));
    } catch {
      setState(prev => ({
        ...prev,
        loading: false,
        loadingMessages: [],
        error: 'Error al decodificar VIN. Intente de nuevo.',
      }));
    }
  }, [clearResults]);

  const handlePartSearch = useCallback(async (code: string) => {
    clearResults();
    setState(prev => ({ ...prev, loading: true, loadingMessages: PART_MESSAGES, error: null }));

    try {
      const { parts } = await searchByPartCode(code);
      setState(prev => ({
        ...prev,
        loading: false,
        loadingMessages: [],
        partResults: parts,
      }));
    } catch {
      setState(prev => ({
        ...prev,
        loading: false,
        loadingMessages: [],
        error: 'Error al buscar pieza. Intente de nuevo.',
      }));
    }
  }, [clearResults]);

  return {
    state,
    toggleBlock,
    handlePlateSearch,
    handleVinSearch,
    handlePartSearch,
  } as const;
}
