import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Invitation() {
  const [confetti, setConfetti] = useState([]);
  const navigate = useNavigate();

    

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

  const handleOpenInvitation = () => {
    navigate('/Wedding');
    };

  return (
    <div className="h-screen w-screen bg-[#04120b] flex flex-col items-center justify-center p-6 text-center select-none antialiased relative overflow-hidden">
      
      {/* Web Font Imports & Custom Keyframe Mechanics */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cinzel:wght@400;500&family=Mr+De+Haviland&family=Montserrat:wght@300;400;500;600&display=swap');
        
        .font-cinzel { font-family: 'Cinzel', serif; }
        .font-script-small { font-family: 'Mr De Haviland', cursive; }
        .font-cursive-main { font-family: 'Alex Brush', cursive; }
        .font-montserrat { font-family: 'Montserrat', sans-serif; }

        @keyframes elegantReveal {
          0% {
            opacity: 0;
            transform: translateY(22px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Elegant drifting down and rotating effect for garden flakes */
        @keyframes gardenFall {
          0% {
            transform: translateY(-5vh) rotate(0deg) translateX(0px);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(105vh) rotate(720deg) translateX(30px);
            opacity: 0;
          }
        }

        .animate-reveal {
          animation: elegantReveal 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }

        .animate-confetti {
          animation: gardenFall linear infinite;
        }
      `}</style>

      {/* --- ENCHANTED GARDEN BACKGROUND --- */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#061a10] via-[#04120b] to-[#020805] pointer-events-none" />
      
      {/* Soft Ambient Dappled Light */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[15%] -left-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-[#1a422a] rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[20%] left-[20%] right-[20%] bottom-[20%] bg-[#c29f53] rounded-full mix-blend-screen filter blur-[150px] opacity-[0.08] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute -bottom-[20%] -right-[10%] w-[70vw] h-[70vw] max-w-[900px] max-h-[900px] bg-[#0d2e20] rounded-full mix-blend-screen filter blur-[140px] opacity-60 animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      {/* --- FALLING THEMED CONFETTI LAYER --- */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {confetti.map((piece) => (
          <div
            key={piece.id}
            className="absolute animate-confetti"
            style={{
              left: piece.left,
              animationDelay: piece.delay,
              animationDuration: piece.duration,
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
              borderRadius: piece.isRound ? '50%' : '0% 80% 20% 80%', // Alternates between droplets and leaf-like shapes
              transform: 'rotate(45deg)',
            }}
          />
        ))}
      </div>

      {/* ----------------------------------- */}

      <div className="relative z-10 flex flex-col items-center w-full max-w-5xl h-full justify-center py-4">
        
        {/* --- HEADER SECTION --- */}
        <div className="mb-6 w-full px-4 flex flex-col items-center text-center shrink-0">
          <p 
            className="animate-reveal font-montserrat text-[#8ca89a] text-[10px] md:text-xs tracking-[0.35em] uppercase font-semibold mb-2 drop-shadow-sm"
            style={{ animationDelay: '150ms' }}
          >
            The Long-Distance Journey Ends Here
          </p>
          
          <h1 
            className="animate-reveal font-cinzel text-[#f2efe6] text-2xl md:text-4xl lg:text-[46px] tracking-[0.06em] font-light leading-none flex items-baseline justify-center flex-wrap gap-x-2 drop-shadow-md"
            style={{ animationDelay: '350ms' }}
          >
            <span><span className="text-[1.25em]">D</span>ISTANCE</span>
            <span><span className="text-[1.25em]">M</span>EANT</span>
            <span><span className="text-[1.25em]">S</span>O</span>
            <span><span className="text-[1.25em]">L</span>ITTLE</span>
          </h1>
          
          <p 
            className="animate-reveal font-script-small text-[#ede9dc] text-3xl md:text-4xl lg:text-[44px] -mt-1 tracking-wider opacity-90 lowercase drop-shadow-md"
            style={{ animationDelay: '550ms' }}
          >
            When you mean so much.
          </p>
        </div>

        {/* --- MAIN HORIZONTAL CARD CONTAINER --- */}
        <div 
          className="animate-reveal relative w-full max-w-[840px] aspect-[1.75/1] max-h-[460px] bg-[#f4f2eb] text-[#0d2e20] rounded-[2rem] px-8 py-10 md:px-14 md:py-12 shadow-[0_30px_70px_rgba(0,0,0,0.8)] border border-white/10 flex flex-col items-center justify-center box-border transform transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) hover:-translate-y-2 hover:scale-[1.015] hover:shadow-[0_40px_80px_rgba(0,0,0,0.9)] group/card"
          style={{ animationDelay: '750ms' }}
        >
          
          {/* PREMIUM INNER FILIGREE ACCENT BORDER FRAME */}
          <div className="absolute inset-4 rounded-[1.6rem] border border-[#c29f53]/30 pointer-events-none" />
          <div className="absolute inset-5 rounded-[1.4rem] border border-[#0d2e20]/15 pointer-events-none" />

          {/* TOP LEFT CUSTOM CORNER GEOMETRY (Botanical) */}
          <svg className="absolute top-8 left-8 w-[90px] h-[90px] pointer-events-none opacity-85 transition-transform duration-500 group-hover/card:scale-105" viewBox="0 0 100 100" fill="none">
            <path d="M 5 0 Q 5 85 90 85" stroke="#0d2e20" strokeWidth="1" />
            <path d="M 16 0 Q 16 74 90 74" stroke="#0d2e20" strokeWidth="0.5" />
            <path d="M 27 0 Q 27 63 90 63" stroke="#0d2e20" strokeWidth="0.25" />
            <path d="M 0 35 Q 40 35 45 90" stroke="#c29f53" strokeWidth="1" />
            <path d="M 0 52 Q 25 52 30 90" stroke="#c29f53" strokeWidth="0.75" />
            <path d="M 26 35 Q 36 25 41 35 Q 36 45 26 35 Z" stroke="#c29f53" strokeWidth="1" fill="#c29f53" fillOpacity="0.15" />
            <path d="M 13 52 Q 21 44 25 52 Q 21 60 13 52 Z" stroke="#c29f53" strokeWidth="0.75" />
          </svg>

          {/* CARD CONTENT */}
          <div className="flex flex-col items-center text-center w-full max-w-2xl z-10">
            
            <p 
              className="animate-reveal font-cinzel text-[11px] md:text-xs tracking-[0.35em] font-medium text-[#4c5b52] mb-3"
              style={{ animationDelay: '950ms' }}
            >
              SAVE OUR DATE
            </p>
            
            <h2 
              className="animate-reveal font-cursive-main text-5xl md:text-[68px] text-[#0d2e20] font-normal my-1 py-1 select-none transform -skew-x-6 tracking-wide leading-none transition-all duration-500 group-hover/card:tracking-widest"
              style={{ animationDelay: '1100ms' }}
            >
              Neille & Camille
            </h2>
            
            {/* Reference Ornamental Line Split */}
            <div 
              className="animate-reveal w-full max-w-[260px] my-3 flex items-center justify-center opacity-90"
              style={{ animationDelay: '1200ms' }}
            >
              <svg viewBox="0 0 300 20" className="w-full fill-[#0d2e20]">
                <path d="M 10 10 C 70 10, 100 9, 130 8 C 130 9, 130 11, 130 12 C 100 11, 70 10, 10 10 Z" opacity="0.7" />
                <path d="M 150 10 M 144 10 C 144 7, 147 6, 150 10 C 153 6, 156 7, 156 10 C 156 13, 153 14, 150 10 C 147 14, 144 13, 144 10 Z" />
                <circle cx="140" cy="10" r="1.5" />
                <circle cx="160" cy="10" r="1.5" />
                <path d="M 290 10 C 230 10, 200 9, 170 8 C 170 9, 170 11, 170 12 C 200 11, 230 10, 290 10 Z" opacity="0.7" />
              </svg>
            </div>

            <p 
              className="animate-reveal font-cinzel text-[10px] md:text-[11px] tracking-[0.3em] font-medium text-[#4c5b52] mb-5"
              style={{ animationDelay: '1300ms' }}
            >
              THE GARDEN WEDDING CELEBRATION
            </p>
            
            <p 
              className="animate-reveal font-montserrat text-[11px] md:text-[13px] leading-[1.75] max-w-md font-normal tracking-[0.04em] text-[#2c3d33] mb-6 px-2"
              style={{ animationDelay: '1400ms' }}
            >
              Crossing oceans, lands, and skies to pledge forever.<br />
              <span className="opacity-95 font-light">Click below to begin the journey to our garden gates.</span>
            </p>
            
            {/* Dark Pill Button */}
            <button 
              onClick={handleOpenInvitation}
              className="animate-reveal group/btn flex items-center justify-center gap-2 bg-[#122b1f] text-[#f4f2eb] text-[11px] md:text-xs font-montserrat tracking-[0.15em] font-medium py-3 px-8 rounded-full shadow-lg transition-all duration-300 relative overflow-hidden active:scale-[0.98] hover:shadow-[0_0_25px_rgba(194,159,83,0.4)]"
              style={{ animationDelay: '1550ms' }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,244,214,0.12)_0%,transparent_70%)] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <span className="relative z-10">Open Invitation</span>
              <span className="text-xs transition-transform duration-300 group-hover/btn:translate-x-1.5 relative z-10">➔</span>
            </button>
            
          </div>

          {/* BOTTOM RIGHT CUSTOM CORNER GEOMETRY (Botanical - Rotated 180deg) */}
          <svg className="absolute bottom-8 right-8 w-[90px] h-[90px] pointer-events-none opacity-85 transform rotate-180 transition-transform duration-500 group-hover/card:scale-105" viewBox="0 0 100 100" fill="none">
            <path d="M 5 0 Q 5 85 90 85" stroke="#0d2e20" strokeWidth="1" />
            <path d="M 16 0 Q 16 74 90 74" stroke="#0d2e20" strokeWidth="0.5" />
            <path d="M 27 0 Q 27 63 90 63" stroke="#0d2e20" strokeWidth="0.25" />
            <path d="M 0 35 Q 40 35 45 90" stroke="#c29f53" strokeWidth="1" />
            <path d="M 0 52 Q 25 52 30 90" stroke="#c29f53" strokeWidth="0.75" />
            <path d="M 26 35 Q 36 25 41 35 Q 36 45 26 35 Z" stroke="#c29f53" strokeWidth="1" fill="#c29f53" fillOpacity="0.15" />
            <path d="M 13 52 Q 21 44 25 52 Q 21 60 13 52 Z" stroke="#c29f53" strokeWidth="0.75" />
          </svg>

        </div>
      </div>
    </div>
  );
}