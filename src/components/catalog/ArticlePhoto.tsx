import { useEffect, useRef, useState } from "react";
import * as api from "../../lib/remusaApi";
import type { ArticleImageResult } from "../../lib/remusaApi";

/**
 * Module-level cache so each articulo resolves its TecDoc photo at most once
 * per session (the backend also caches 7 days). Keyed by articulo code.
 */
const photoCache = new Map<string, Promise<ArticleImageResult>>();

function fetchArticleImage(articulo: string): Promise<ArticleImageResult> {
  let p = photoCache.get(articulo);
  if (!p) {
    p = api.remusaArticleImage(articulo).catch(() => {
      photoCache.delete(articulo); // allow retry after a network error
      return { found: false, articulo } as ArticleImageResult;
    });
    photoCache.set(articulo, p);
  }
  return p;
}

/**
 * TecDoc product photo for a REMUSA articulo. Fetches lazily — only once the
 * element scrolls into view — so a long result list doesn't burst the TecDoc
 * quota. Renders nothing until a photo is confirmed (no empty placeholder).
 */
export function ArticlePhoto({
  articulo,
  className = "h-14 w-14 rounded-lg object-contain",
  withCaption = false,
}: {
  articulo: string;
  className?: string;
  withCaption?: boolean;
}) {
  const holderRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [result, setResult] = useState<ArticleImageResult | null>(null);

  useEffect(() => {
    const el = holderRef.current;
    if (!el || visible) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "120px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible || !articulo) return;
    let alive = true;
    void fetchArticleImage(articulo).then((r) => {
      if (alive) setResult(r);
    });
    return () => {
      alive = false;
    };
  }, [visible, articulo]);

  const hasPhoto = Boolean(result?.found && result.image);

  return (
    <div ref={holderRef} className={hasPhoto ? "shrink-0" : "h-0 w-0 overflow-hidden"}>
      {hasPhoto ? (
        <div className="overflow-hidden rounded-lg border border-neutral-200/80 bg-white">
          <img
            src={result!.image}
            alt={`Foto ${articulo}`}
            className={className}
            loading="lazy"
            decoding="async"
          />
          {withCaption && result!.supplier ? (
            <p className="border-t border-neutral-100 px-1.5 py-0.5 text-center text-[9px] text-neutral-400">
              {result!.supplier}
              {result!.article_no ? ` · ${result!.article_no}` : ""}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
