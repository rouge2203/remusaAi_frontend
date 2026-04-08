import CatalogFloatingDock from "./CatalogFloatingDock";
import {
  MENU_TECDOC_FALLBACK,
  MENU_TECDOC_MORE,
  MENU_TECDOC_PRIMARY,
} from "../../constants/remusaMenu";
import type { MenuItem } from "../../constants/remusaMenu";

interface TecdocCatalogFloatingDockProps {
  onSelect: (item: MenuItem) => void;
  activePanelId: string | null;
}

export default function TecdocCatalogFloatingDock({
  onSelect,
  activePanelId,
}: TecdocCatalogFloatingDockProps) {
  return (
    <CatalogFloatingDock
      onSelect={onSelect}
      activePanelId={activePanelId}
      allItems={MENU_TECDOC_FALLBACK}
      primaryItems={MENU_TECDOC_PRIMARY}
      moreItems={MENU_TECDOC_MORE}
      headerTitle="> catalogo tecdoc (respaldo)"
      fallbackMenuTitle="catalogo tecdoc (respaldo)"
      ariaLabel="Menú catálogo TecDoc"
    />
  );
}
