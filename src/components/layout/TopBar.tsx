import { IoChatbubblesOutline } from 'react-icons/io5'
import { HiOutlineArrowRightOnRectangle } from 'react-icons/hi2'

interface TopBarProps {
  onChatOpen: () => void;
}

export default function TopBar({ onChatOpen }: TopBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-black/25 backdrop-blur-2xl border-b border-white/10">
      <div className="max-w-[410px] mx-auto flex items-center justify-between px-4 h-14">
        <button
          onClick={onChatOpen}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-text-secondary text-sm font-medium transition-all duration-300 hover:bg-white/10 hover:text-text-primary hover:scale-105 active:scale-95"
        >
          <IoChatbubblesOutline className="text-base" />
          <span>Chat</span>
        </button>

        <h1 className="text-lg font-bold tracking-tight text-text-primary">
          REMUSA<span className="text-accent-orange">AI</span>
        </h1>

        <button
          disabled
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-text-muted text-sm font-medium opacity-50 cursor-not-allowed flex items-center justify-center"
        >
          <HiOutlineArrowRightOnRectangle className="text-[15px]" />
        </button>
      </div>
    </header>
  );
}
