import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import TopBar from './TopBar'
import BottomBar from './BottomBar'
import ChatDialog from '../chat/ChatDialog'

export default function Layout() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      <TopBar onChatOpen={() => setChatOpen(true)} />

      <main className="flex-1 overflow-y-auto pt-14 pb-16">
        <div className="max-w-lg mx-auto px-4 py-4">
          <Outlet />
        </div>
      </main>

      <BottomBar />

      <ChatDialog open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
