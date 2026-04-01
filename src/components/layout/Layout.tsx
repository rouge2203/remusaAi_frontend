import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import BottomBar from './BottomBar'
import ChatDialog from '../chat/ChatDialog'

export type LayoutOutletContext = {
  openChat: () => void;
};

/** Mobile: full viewport width (no 440px cap). Desktop: centered column. */
const shellClass =
  'w-full max-w-full lg:max-w-[600px] xl:max-w-[680px] mx-auto min-h-full';

export default function Layout() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="h-full w-full bg-[#0b0b0c] relative overflow-hidden lg:bg-[#141416]">
      <main className="h-full overflow-y-auto pb-24 relative z-10 lg:py-8 lg:pb-28 lg:px-6">
        <div
          className={`${shellClass} lg:rounded-[28px] lg:overflow-hidden lg:border lg:border-white/10 lg:shadow-[0_40px_100px_-50px_rgba(0,0,0,0.75)] lg:bg-[#0b0b0c]`}
        >
          <Outlet context={{ openChat: () => setChatOpen(true) } satisfies LayoutOutletContext} />
        </div>
      </main>

      <BottomBar />
      <ChatDialog open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
