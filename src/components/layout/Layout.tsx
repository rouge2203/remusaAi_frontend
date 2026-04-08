import { useState, useRef } from "react";
import { Outlet } from "react-router-dom";
import ChatDialog from "../chat/ChatDialog";
import { useThemeColorOnScroll } from "../../hooks/useThemeColorOnScroll";

export type LayoutOutletContext = {
  openChat: () => void;
};

/** Mobile: full width. lg+: cap ancho para panel izquierdo + derecho (búsqueda / resultados). */
const shellClass =
  "w-full max-w-full lg:max-w-[1200px] mx-auto min-h-full flex flex-col";

export default function Layout() {
  const [chatOpen, setChatOpen] = useState(false);
  const mainScrollRef = useRef<HTMLElement>(null);
  useThemeColorOnScroll(mainScrollRef);

  return (
    <div className="h-full w-full bg-[#0b0b0c] relative overflow-hidden lg:bg-[#141416]">
      <main
        ref={mainScrollRef}
        className="h-full touch-pan-y overflow-y-auto overflow-x-hidden overscroll-y-auto relative z-10 lg:flex lg:flex-col lg:overflow-hidden lg:py-8 lg:px-6"
      >
        <div
          className={`${shellClass} lg:rounded-[28px] lg:overflow-hidden lg:border lg:border-white/10 lg:shadow-[0_40px_100px_-50px_rgba(0,0,0,0.75)] lg:bg-[#0b0b0c] lg:min-h-0 lg:flex-1`}
        >
          <Outlet
            context={
              {
                openChat: () => setChatOpen(true),
              } satisfies LayoutOutletContext
            }
          />
        </div>
      </main>

      <ChatDialog open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
