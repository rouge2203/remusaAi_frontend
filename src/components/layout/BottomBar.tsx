import { HiOutlineHome, HiOutlineMagnifyingGlass, HiOutlineCog6Tooth } from 'react-icons/hi2'
import { PiEngineBold } from 'react-icons/pi'

const buttons = [
  { icon: HiOutlineHome, label: 'Inicio' },
  { icon: HiOutlineMagnifyingGlass, label: 'Buscar' },
  { icon: PiEngineBold, label: 'Partes' },
  { icon: HiOutlineCog6Tooth, label: 'Config' },
];

export default function BottomBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-bg-primary/80 backdrop-blur-xl border-t border-border-subtle">
      <div className="max-w-lg mx-auto flex items-center justify-around px-4 h-16 pb-[env(safe-area-inset-bottom)]">
        {buttons.map((btn) => (
          <button
            key={btn.label}
            disabled
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl text-text-muted opacity-50 cursor-not-allowed transition-all duration-200"
          >
            <btn.icon className="text-xl" />
            <span className="text-[10px] font-medium">{btn.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
