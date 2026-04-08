import type { RemusaBatchHit } from "./remusaApi";
import { remusaBatchCheck } from "./remusaApi";

/** OEM / aftermarket numbers on a TecDoc list article (sistemaRemusa._tecdoc_remusa_check_articles). */
export function collectPartNumbersFromTecdocArticle(a: Record<string, unknown>): string[] {
  const out: string[] = [];
  const artNo = a.articleNo ?? a.articleNumber;
  if (artNo != null && String(artNo).trim()) out.push(String(artNo).trim());
  const oems = (a.oemNumbers ?? a.oemNo) as unknown;
  if (Array.isArray(oems)) {
    for (const o of oems) {
      if (!o || typeof o !== "object") continue;
      const row = o as Record<string, unknown>;
      const n = row.oemDisplayNo ?? row.oemNumber;
      if (n != null && String(n).trim()) out.push(String(n).trim());
    }
  }
  return out;
}

export type TecdocArticleRemusaEntry = { hit: RemusaBatchHit; matched_via: string };

/** Batch REMUSA check for TecDoc article list; maps articleId -> first hit (articleNo then OEM order). */
export async function buildTecdocArticlesRemusaMap(
  articles: Array<Record<string, unknown>>,
): Promise<Record<string, TecdocArticleRemusaEntry>> {
  const byArticle: Record<string, TecdocArticleRemusaEntry> = {};
  const articlePns: Record<string, string[]> = {};
  const allPn: string[] = [];

  for (const a of articles) {
    const aid = String(a.articleId ?? "");
    if (!aid) continue;
    const pns = collectPartNumbersFromTecdocArticle(a);
    articlePns[aid] = pns;
    for (const p of pns) allPn.push(p);
  }

  const unique = [...new Set(allPn.filter(Boolean))];
  if (unique.length === 0) return {};

  const batch = await remusaBatchCheck(unique);
  const results = batch.results ?? {};

  for (const aid of Object.keys(articlePns)) {
    for (const pn of articlePns[aid]) {
      const hit = results[pn];
      if (hit) {
        byArticle[aid] = { hit, matched_via: pn };
        break;
      }
    }
  }

  return byArticle;
}
