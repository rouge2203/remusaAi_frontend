import type { MenuItem } from "./remusaMenu";

/** OEM sheet actions when part already maps to REMUSA. */
export const PART_DETAIL_MENU_MATCH: MenuItem[] = [
  {
    id: "t",
    title: "buscar en tecdoc",
    subtitle: "specs, imagen, autos compatibles",
  },
  {
    id: "2",
    title: "reemplazos y equivalentes",
    subtitle: "API 4004 · intercambios 17VIN",
  },
  {
    id: "3",
    title: "vehículos compatibles",
    subtitle: "detallado por versión / trim",
  },
  {
    id: "4",
    title: "vehículos compatibles",
    subtitle: "agrupado por motor (aftermarket)",
  },
  {
    id: "5",
    title: "precio 4s",
    subtitle: "referencia de mercado · API 4006",
  },
  {
    id: "6",
    title: "ilustración epc",
    subtitle: "diagrama y posición · API 4002 + 4005",
  },
];

/** OEM sheet actions when no direct REMUSA hit; includes cross-ref. */
export const PART_DETAIL_MENU_NOMATCH: MenuItem[] = [
  {
    id: "t",
    title: "buscar en tecdoc",
    subtitle: "specs, imagen, autos compatibles",
  },
  {
    id: "1",
    title: "info de esta parte",
    subtitle: "búsqueda exacta · API 4001",
  },
  {
    id: "2",
    title: "reemplazos y equivalentes",
    subtitle: "API 4004",
  },
  {
    id: "3",
    title: "modelos compatibles",
    subtitle: "detallado por versión / trim",
  },
  {
    id: "4",
    title: "modelos compatibles",
    subtitle: "agrupado por motor",
  },
  {
    id: "5",
    title: "precio 4s",
    subtitle: "API 4006",
  },
  {
    id: "6",
    title: "ilustración epc",
    subtitle: "API 4002 + 4005",
  },
  {
    id: "e",
    title: "buscar en remusa por equivalencias",
    subtitle: "cross-ref 17VIN",
  },
];
