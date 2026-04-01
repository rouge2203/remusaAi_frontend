/**
 * Mirrors opciones de `catalog_browser` en sistemaRemusa.py (17VIN + EPC).
 */
export const MENU_CATALOG_EPC = [
  { id: "1", title: "navegar categorias epc", subtitle: "diagramas y partes del catalogo" },
  { id: "2", title: "buscar parte por numero oem", subtitle: "en este vehiculo (contexto vin)" },
  { id: "3", title: "ver todos los numeros oe", subtitle: "2500–3000 partes aprox." },
  { id: "4", title: "opciones de fabrica / atributos", subtitle: "codigos epc del vehiculo" },
  { id: "5", title: "buscar parte por numero", subtitle: "sin contexto vin (standalone)" },
  { id: "6", title: "consultar precio 4s", subtitle: "por numero oem" },
  { id: "7", title: "matches con remusa", subtitle: "cross-ref inventario local" },
  { id: "b", title: "volver a busqueda de placa", subtitle: "cerrar catalogo" },
] as const;

/**
 * `tecdoc_catalog_browser` cuando 17VIN falla pero hay TecDoc (sistemaRemusa.py).
 */
export const MENU_TECDOC_FALLBACK = [
  { id: "1", title: "navegar por categorias", subtitle: "grupos de partes tecdoc" },
  { id: "2", title: "buscar parte por numero oem", subtitle: "api 4001 + cross-ref" },
  { id: "3", title: "buscar aftermarket por oem", subtitle: "cross-ref tecdoc" },
  { id: "4", title: "consultar precio 4s", subtitle: "por numero oem" },
  { id: "5", title: "buscar en inventario remusa", subtitle: "numero de parte" },
  { id: "b", title: "volver a busqueda de placa", subtitle: "" },
] as const;

/**
 * Submenu tipo `show_part_detail` / pieza seleccionada (sistemaRemusa.py).
 */
export const MENU_PART_DETAIL = [
  { id: "t", title: "buscar en tecdoc", subtitle: "specs, imagen, autos compatibles" },
  { id: "1", title: "info de esta parte", subtitle: "api 4001" },
  { id: "2", title: "reemplazos / equivalencias", subtitle: "api 4004" },
  { id: "3", title: "modelos compatibles", subtitle: "detallado por version / trim" },
  { id: "4", title: "modelos compatibles", subtitle: "agrupado por motor" },
  { id: "5", title: "consultar precio 4s", subtitle: "api 4006" },
  { id: "6", title: "ilustracion epc", subtitle: "api 4002 + 4005" },
  { id: "b", title: "volver a lista de partes", subtitle: "" },
] as const;

export type MenuItem = { id: string; title: string; subtitle: string };
