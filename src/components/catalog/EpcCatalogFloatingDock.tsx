import CatalogFloatingDock from "./CatalogFloatingDock";
import {
  MENU_CATALOG_EPC,
  MENU_CATALOG_EPC_MORE,
  MENU_CATALOG_EPC_PRIMARY,
} from "../../constants/remusaMenu";
import type { MenuItem } from "../../constants/remusaMenu";

interface EpcCatalogFloatingDockProps {
  onSelect: (item: MenuItem) => void;
  activePanelId: string | null;
}

export default function EpcCatalogFloatingDock({
  onSelect,
  activePanelId,
}: EpcCatalogFloatingDockProps) {
  return (
    <CatalogFloatingDock
      onSelect={onSelect}
      activePanelId={activePanelId}
      allItems={MENU_CATALOG_EPC}
      primaryItems={MENU_CATALOG_EPC_PRIMARY}
      moreItems={MENU_CATALOG_EPC_MORE}
      headerTitle="> catalogo epc (17vin)"
      fallbackMenuTitle="catalogo epc (17vin)"
      ariaLabel="Menú catálogo EPC"
    />
  );
}
