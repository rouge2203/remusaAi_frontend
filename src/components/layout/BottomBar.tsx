import { HiOutlineHome, HiOutlinePlus, HiOutlineSquares2X2, HiOutlineArrowPath } from 'react-icons/hi2'

const buttons = [
  { icon: HiOutlineHome, active: true },
  { icon: HiOutlinePlus, active: false },
  { icon: HiOutlineSquares2X2, active: false },
  { icon: HiOutlineArrowPath, active: false },
];

const barWidth =
  'w-full max-w-full lg:max-w-[600px] xl:max-w-[680px] mx-auto';

export default function BottomBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0b0b0c]/95 backdrop-blur-md border-t border-white/5 lg:border-white/10 lg:bg-[#0b0b0c]/90">
      <div className={`${barWidth} flex items-center justify-center gap-5 px-6 h-[72px] pb-[env(safe-area-inset-bottom)] lg:gap-6 lg:h-20`}>
        {buttons.map((btn, index) => (
          <button
            key={index}
            disabled
            className={`flex items-center justify-center w-[52px] h-[52px] lg:w-14 lg:h-14 rounded-full transition-all duration-300 ${
              btn.active
                ? 'bg-[#75141C] text-white shadow-lg shadow-[#75141C]/35'
                : 'bg-[#1a1a1d] text-white border border-white/10 opacity-90'
            } cursor-not-allowed`}
          >
            <btn.icon className="text-[22px] lg:text-2xl" strokeWidth={1.75} />
          </button>
        ))}
      </div>
    </nav>
  );
}
