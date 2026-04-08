/**
 * TecDoc category tree: { id: { text, children: { ... } } } — same shape as sistemaRemusa.tecdoc_browse_categories.
 */

export interface TecdocCatNode {
  id: string;
  name: string;
  /** Nested categories (object map from API). */
  rawChildren: Record<string, unknown>;
}

export function parseTecdocCategoryMap(raw: unknown): TecdocCatNode[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  const o = raw as Record<string, unknown>;
  return Object.entries(o)
    .map(([id, v]) => {
      const node = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
      const ch = node.children;
      const rawChildren =
        typeof ch === "object" && ch !== null && !Array.isArray(ch)
          ? (ch as Record<string, unknown>)
          : {};
      return {
        id,
        name: String(node.text ?? node.name ?? node.assemblyGroupName ?? id),
        rawChildren,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export function tecdocCategoryHasChildren(n: TecdocCatNode): boolean {
  return Object.keys(n.rawChildren).length > 0;
}

/** Nodes visible at current breadcrumb path (stack of parent ids). */
export function getTecdocCategoryLevel(
  roots: TecdocCatNode[],
  stack: { id: string }[],
): TecdocCatNode[] {
  if (stack.length === 0) return roots;
  let level = roots;
  for (const seg of stack) {
    const found = level.find((n) => n.id === seg.id);
    if (!found) return [];
    level = parseTecdocCategoryMap(found.rawChildren);
  }
  return level;
}
