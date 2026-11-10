import React from 'react';

interface PacoMascotProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showBadge?: boolean;
}

export const PacoMascot: React.FC<PacoMascotProps> = ({
  className = '',
  size = 'lg',
  showBadge = true,
}) => {
  const sizeMap = {
    sm: 'w-28 h-28',
    md: 'w-40 h-40 sm:w-48 sm:h-48',
    lg: 'w-56 h-56 sm:w-64 sm:h-64 md:w-full md:h-full md:max-h-[320px]',
    xl: 'w-64 h-64 sm:w-80 sm:h-80 md:w-full md:h-full md:max-h-[380px]',
    full: 'w-full h-full max-h-[350px] sm:max-h-[400px]',
  };

  return (
    <div id="paco-mascot-wrapper" className={`relative flex flex-col items-center justify-center select-none h-full ${className}`}>
      {showBadge && (
        <div id="paco-mascot-badge" className="mb-2 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/40 text-emerald-300 text-[11px] sm:text-xs font-semibold shadow-sm animate-bounce">
          🐘 Paco, votre guide Bourse !
        </div>
      )}

      <div id="paco-mascot-img-container" className={`relative ${sizeMap[size]} transition-transform hover:scale-105 duration-300 flex items-center justify-center`}>
        <img
          id="paco-mascot-img"
          src="/Paco_mascotte.png"
          alt="Paco, le Guide Bourse Facile"
          className="w-auto h-full max-h-[350px] object-contain bg-transparent filter drop-shadow-[0_12px_24px_rgba(16,185,129,0.25)]"
        />
      </div>
    </div>
  );
};


