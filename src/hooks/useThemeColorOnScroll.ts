import { useLayoutEffect, type RefObject } from "react";

const BRAND_RED = "#75141C";
const TOP_WHITE = "#ffffff";

function isIosTouchDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

/** Safari on iOS (not Chrome / Firefox / Edge on iOS — those should keep solid brand red). */
function isIosSafariForTheme(): boolean {
  if (!isIosTouchDevice()) return false;
  const ua = navigator.userAgent;
  if (/CriOS|FxiOS|EdgiOS|OPiOS|OPT\//i.test(ua)) return false;
  return true;
}

/**
 * Safari iOS: theme-color white at scroll top, brand red when scrolled (matches status strip to header).
 * Chrome / Android / desktop: always brand red.
 */
function setAllThemeColors(color: string) {
  document.querySelectorAll('meta[name="theme-color"]').forEach((node) => {
    node.setAttribute("content", color);
  });
}

export function useThemeColorOnScroll(
  scrollRef: RefObject<HTMLElement | null>,
): void {
  useLayoutEffect(() => {
    const dynamic = isIosSafariForTheme();

    const apply = () => {
      const el = scrollRef.current;
      if (!el) return;
      if (!dynamic) {
        setAllThemeColors(BRAND_RED);
        return;
      }
      const atTop = el.scrollTop <= 6;
      setAllThemeColors(atTop ? TOP_WHITE : BRAND_RED);
    };

    const el = scrollRef.current;
    if (!el) return;

    apply();
    el.addEventListener("scroll", apply, { passive: true });
    window.addEventListener("resize", apply, { passive: true });

    return () => {
      el.removeEventListener("scroll", apply);
      window.removeEventListener("resize", apply);
    };
  }, [scrollRef]);
}
