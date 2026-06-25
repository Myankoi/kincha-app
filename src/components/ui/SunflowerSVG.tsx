import React from 'react';

interface SunflowerSVGProps {
  className?: string;
  size?: number;
}

export const SunflowerSVG: React.FC<SunflowerSVGProps> = ({ className = '', size = 100 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none filter drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-transform duration-300 hover:rotate-12 ${className}`}
    >
      {/* Petals Group */}
      <g stroke="#000" strokeWidth="3" strokeLinejoin="round">
        {/* Main Petals */}
        <path d="M50 10 L58 35 L50 45 L42 35 Z" fill="#FACC15" />
        <path d="M50 90 L58 65 L50 55 L42 65 Z" fill="#FACC15" />
        <path d="M10 50 L35 58 L45 50 L35 42 Z" fill="#FACC15" />
        <path d="M90 50 L65 58 L55 50 L65 42 Z" fill="#FACC15" />
        
        {/* Diagonal Petals */}
        <path d="M21.7 21.7 L41.2 37.7 L46.5 46.5 L37.7 41.2 Z" fill="#FACC15" />
        <path d="M78.3 21.7 L62.3 37.7 L53.5 46.5 L58.8 41.2 Z" fill="#FACC15" />
        <path d="M78.3 78.3 L58.8 62.3 L53.5 53.5 L62.3 58.8 Z" fill="#FACC15" />
        <path d="M21.7 78.3 L37.7 62.3 L46.5 53.5 L41.2 58.8 Z" fill="#FACC15" />

        {/* Small Petal Accents between main petals */}
        <circle cx="50" cy="28" r="4" fill="#F87171" stroke="#000" strokeWidth="2" />
        <circle cx="50" cy="72" r="4" fill="#F87171" stroke="#000" strokeWidth="2" />
        <circle cx="28" cy="50" r="4" fill="#F87171" stroke="#000" strokeWidth="2" />
        <circle cx="72" cy="50" r="4" fill="#F87171" stroke="#000" strokeWidth="2" />
      </g>
      
      {/* Center circle */}
      <circle cx="50" cy="50" r="18" fill="#1E1B4B" stroke="#000" strokeWidth="4" />
      
      {/* Little seeds/details inside center */}
      <circle cx="45" cy="45" r="2" fill="#F59E0B" />
      <circle cx="55" cy="45" r="2" fill="#F59E0B" />
      <circle cx="45" cy="55" r="2" fill="#F59E0B" />
      <circle cx="55" cy="55" r="2" fill="#F59E0B" />
      <circle cx="50" cy="50" r="2.5" fill="#EF4444" />
    </svg>
  );
};

export default SunflowerSVG;
