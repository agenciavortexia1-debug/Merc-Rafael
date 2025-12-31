
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  light?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showText = true, light = false }) => {
  const sizes = {
    sm: { icon: 20, font: 'text-sm' },
    md: { icon: 32, font: 'text-lg' },
    lg: { icon: 48, font: 'text-2xl' },
    xl: { icon: 80, font: 'text-5xl' }
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div 
        className={`relative flex items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/20`}
        style={{ width: currentSize.icon * 1.5, height: currentSize.icon * 1.5 }}
      >
        <svg 
          width={currentSize.icon} 
          height={currentSize.icon} 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z" 
            stroke="white" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M3 6H21" 
            stroke="white" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10" 
            stroke="white" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        <div className="absolute -bottom-1 -right-1 w-1/2 h-1/2 bg-emerald-500 rounded-lg border-2 border-blue-600 flex items-center justify-center">
           <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
             <polyline points="20 6 9 17 4 12"></polyline>
           </svg>
        </div>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={`${currentSize.font} font-black tracking-tighter leading-none ${light ? 'text-white' : 'text-slate-900'}`}>
            MERCADINHO
          </span>
          <span className={`${size === 'xl' ? 'text-2xl' : 'text-xs'} font-bold tracking-[0.2em] uppercase ${light ? 'text-blue-200' : 'text-blue-600'}`}>
            Rafael
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
