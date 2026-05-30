import React, { useEffect, useState } from 'react';

export default function GateInvitation({ isOpen, isOpening, openInvitation }) {
  const [confetti, setConfetti] = useState([]);

  useEffect(() => {
    const colors = ['#c29f53', '#1a422a', '#8ca89a', '#ede9dc'];
    const pieces = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      color: colors[i % colors.length],
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 8}s`,
      duration: `${6 + Math.random() * 6}s`,
      size: `${4 + Math.random() * 6}px`,
      isRound: Math.random() > 0.5,
    }));
    setConfetti(pieces);
  }, []);

  return (
    <>
      <style>{`
        @keyframes gardenFall {
          0% { transform: translateY(-5vh) rotate(0deg); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti { animation: gardenFall linear infinite; }
        .gate { transition: transform 1.5s cubic-bezier(0.645, 0.045, 0.355, 1); }
      `}</style>

      {!isOpen && (
        <div className="fixed inset-0 z-50 flex overflow-hidden bg-[#04120b]">
          {/* --- AMBIENT GARDEN BACKGROUND --- */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#061a10] via-[#04120b] to-[#020805]" />
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-[15%] -left-[10%] w-[60vw] h-[60vw] bg-[#1a422a] rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-pulse" />
            <div className="absolute -bottom-[20%] -right-[10%] w-[70vw] h-[70vw] bg-[#0d2e20] rounded-full mix-blend-screen filter blur-[140px] opacity-60 animate-pulse" />
          </div>

          {/* --- CONFETTI LAYER --- */}
          <div className="absolute inset-0 pointer-events-none">
            {confetti.map((p) => (
              <div key={p.id} className="absolute animate-confetti" 
                style={{ left: p.left, animationDelay: p.delay, animationDuration: p.duration, 
                         width: p.size, height: p.size, backgroundColor: p.color, 
                         borderRadius: p.isRound ? '50%' : '0% 80% 20% 80%' }} />
            ))}
          </div>

          {/* --- GATE DOORS --- */}
          <div className={`gate flex-1 bg-[#081a11] border-r border-[#c29f53]/20 flex items-center justify-end pr-8 ${isOpening ? '-translate-x-full' : 'translate-x-0'}`} />
          <div className={`gate flex-1 bg-[#081a11] border-l border-[#c29f53]/20 flex items-center justify-start pl-8 ${isOpening ? 'translate-x-full' : 'translate-x-0'}`} />

          {/* --- CONTENT OVERLAY --- */}
          <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center transition-opacity duration-700 ${isOpening ? 'opacity-0' : 'opacity-100'}`}>
            <h1 className="font-cinzel text-5xl md:text-7xl mb-6 text-[#ede9dc] tracking-widest">C & P</h1>
            <button 
              onClick={openInvitation} 
              className="border border-[#c29f53] text-[#c29f53] px-10 py-3 tracking-[0.2em] hover:bg-[#c29f53] hover:text-[#04120b] transition-all duration-300 font-montserrat text-sm"
            >
              ENTER THE GARDEN
            </button>
          </div>
        </div>
      )}
    </>
  );
}