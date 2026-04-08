import CatalogFloatingDock from "./CatalogFloatingDock";
import {
  MENU_PART_DETAIL,
  MENU_PART_DETAIL_MORE,
  MENU_PART_DETAIL_PRIMARY,
} from "../../constants/remusaMenu";
import type { MenuItem } from "../../constants/remusaMenu";

interface PartDetailFloatingDockProps {
  onSelect: (item: MenuItem) => void;
  activePanelId: string | null;
}

export default function PartDetailFloatingDock({
  onSelect,
  activePanelId,
}: PartDetailFloatingDockProps) {
  return (
    <CatalogFloatingDock
      onSelect={onSelect}
      activePanelId={activePanelId}
      allItems={MENU_PART_DETAIL}
      primaryItems={MENU_PART_DETAIL_PRIMARY}
      moreItems={MENU_PART_DETAIL_MORE}
      headerTitle="> pieza seleccionada"
      fallbackMenuTitle="pieza seleccionada"
      ariaLabel="Menú detalle de pieza"
    />
  );
}
