/**
 * Pull selected factory attributes from 17VIN decode `model_original_epc_list`
 * (CarAttributes), English preferred — same idea as SistemaRemusa.show_decode_result.
 */

const PATTERNS: { label: string; test: (name: string) => boolean }[] = [
  {
    label: "Engine Number",
    test: (n) =>
      n.includes("engine") && n.includes("number"),
  },
  {
    label: "Transmission Number",
    test: (n) =>
      (n.includes("transmission") && n.includes("number")) ||
      n.includes("transaxle number"),
  },
  {
    label: "ENGINE CAPACITY",
    test: (n) =>
      n.includes("engine capacity") ||
      (n.includes("capacity") && n.includes("engine")) ||
      n === "cc" ||
      n.includes("displacement"),
  },
  {
    label: "TRANSAXLE",
    test: (n) =>
      n.includes("transaxle") && !n.includes("number"),
  },
];

function normAttrName(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase();
}

export function extractVinFactorySpecs(
  decodeData: Record<string, unknown> | null | undefined,
): { label: string; value: string }[] {
  if (!decodeData) return [];
  const blocks = (decodeData.model_original_epc_list as Array<Record<string, unknown>>) ?? [];
  const rows: { label: string; value: string; order: number }[] = [];
  let order = 0;

  for (const block of blocks) {
    const attrs = (block.CarAttributes as Array<Record<string, unknown>>) ?? [];
    const en = attrs.filter((a) => String(a.Language) === "en");
    const use = en.length ? en : attrs.filter((a) => String(a.Language) === "zh");
    const list = use.length ? use : attrs;

    for (const a of list) {
      const name = normAttrName(a.Col_name);
      const val = String(a.Col_value ?? "").trim();
      if (!name || !val) continue;
      for (let pi = 0; pi < PATTERNS.length; pi++) {
        const { label, test } = PATTERNS[pi];
        if (test(name)) {
          rows.push({ label, value: val, order: order++ * 10 + pi });
          break;
        }
      }
    }
  }

  const byLabel = new Map<string, { label: string; value: string; order: number }>();
  for (const r of rows) {
    const prev = byLabel.get(r.label);
    if (!prev || r.order < prev.order) byLabel.set(r.label, r);
  }
  return PATTERNS.map((p) => byLabel.get(p.label)).filter(Boolean) as {
    label: string;
    value: string;
  }[];
}
