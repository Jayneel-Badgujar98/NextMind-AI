// src/components/common/LogoChakra.jsx
import React from 'react';

export const LogoChakra = ({ className = "w-10 h-10 text-emerald-600 dark:text-emerald-400" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor">
    <g strokeWidth="6" strokeLinecap="round">
      {/* 4 Overlapping Nodes/Petals */}
      <circle cx="50" cy="35" r="22" opacity="0.8" />
      <circle cx="65" cy="50" r="22" opacity="0.8" />
      <circle cx="50" cy="65" r="22" opacity="0.8" />
      <circle cx="35" cy="50" r="22" opacity="0.8" />
      {/* Center AI Core */}
      <circle cx="50" cy="50" r="8" fill="currentColor" stroke="none" />
    </g>
  </svg>
);



// src/components/common/LogoInfinity.jsx


export const LogoInfinity = ({ className = "w-10 h-10 text-emerald-600 dark:text-emerald-400" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor">
    {/* Angular Infinity Loop */}
    <path 
      d="M 15 50 L 35 25 L 65 75 L 85 50 L 65 25 L 35 75 Z" 
      strokeWidth="8" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    {/* Central Processing Node */}
    <circle cx="50" cy="50" r="6" fill="currentColor" stroke="none" />
  </svg>
);

// src/components/common/LogoSpark.jsx

export const LogoSpark = ({ className = "w-10 h-10 text-emerald-600 dark:text-emerald-400" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor">
    {/* Abstract 'N' Letter */}
    <path 
      d="M 25 80 V 30 L 65 80 V 30" 
      strokeWidth="10" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    {/* AI Magic Spark / Star */}
    <path 
      d="M 80 10 Q 80 20 90 20 Q 80 20 80 30 Q 80 20 70 20 Q 80 20 80 10 Z" 
      fill="currentColor" 
      stroke="none" 
      className="animate-pulse"
    />
  </svg>
);
