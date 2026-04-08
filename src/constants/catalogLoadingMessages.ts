/** Terminal-style lines for catalog / part-detail async loads (Resultados panel). */

export const EPC_LOADING_MESSAGES = {
  categories: [
    "Conectando al catálogo EPC...",
    "Solicitando árbol de categorías...",
    "Preparando navegación por niveles...",
  ],
  parts: [
    "Cargando partes del diagrama...",
    "Resolviendo catálogo y referencias...",
  ],
  allOe: [
    "Descargando lista completa de números OE...",
    "Agregando resultados por página...",
  ],
  remusa: [
    "Cruce con inventario REMUSA...",
    "Comparando números OE con referencias locales...",
    "Preparando tabla de coincidencias...",
  ],
  oemSearch: [
    "Búsqueda OEM en vehículo actual...",
    "Consultando catálogo EPC...",
  ],
  standalone: [
    "Búsqueda global de parte...",
    "Consultando índice de piezas...",
  ],
  price: [
    "Consultando precio 4S (referencia)...",
    "Sincronizando datos de mercado...",
  ],
} as const;

export type EpcLoadingKey = keyof typeof EPC_LOADING_MESSAGES;

export const TECDOC_LOADING_MESSAGES = {
  categories: [
    "Catálogo TecDoc...",
    "Cargando categorías del vehículo...",
  ],
  articles: [
    "Cargando artículos de la categoría...",
    "Resolviendo TecDoc...",
  ],
  oem: [
    "Búsqueda OEM TecDoc...",
    "Consultando número de parte...",
  ],
  aft: [
    "Cruce aftermarket TecDoc...",
    "Buscando equivalentes...",
  ],
  price: [
    "Consultando precio 4S...",
  ],
  remusa: [
    "Inventario REMUSA...",
    "Consultando stock y referencias...",
  ],
} as const;

export type TecdocLoadingKey = keyof typeof TECDOC_LOADING_MESSAGES;

export const PART_DETAIL_LOADING_MESSAGES = {
  t: [
    "Consulta TecDoc...",
    "Resolviendo número OEM...",
  ],
  "1": [
    "Búsqueda exacta de parte...",
    "Sincronizando con catálogo...",
  ],
  "2": [
    "Intercambios y equivalentes...",
    "Cargando cruces...",
  ],
  "3": [
    "Aplicaciones en vehículos (OE)...",
    "Consultando bases de vehículo...",
  ],
  "4": [
    "Aplicaciones aftermarket...",
    "Cargando datos de montaje...",
  ],
  "5": [
    "Precio de referencia...",
  ],
  "6": [
    "Ilustración EPC...",
    "Cargando diagrama y posición...",
  ],
  e: [
    "Equivalencias REMUSA (cross-ref)...",
    "Consultando intercambio 17VIN...",
  ],
} as const;

export type PartDetailLoadingKey = keyof typeof PART_DETAIL_LOADING_MESSAGES;

/** Terminal lines while fetching REMUSA article detail in OEM part sheet. */
export const PART_DETAIL_REMUSA_DETAIL_MESSAGES = [
  "Consultando ficha REMUSA...",
  "Cargando costos, clasificación e inventario...",
] as const;
