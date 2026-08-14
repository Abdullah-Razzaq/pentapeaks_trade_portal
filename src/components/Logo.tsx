import React from 'react';
import './Logo.css';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = '' }: LogoProps) {
  return (
    <div className={`logo ${className}`}>
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
        <defs>
          <linearGradient id="arrowGrad" x1="2" y1="22" x2="28" y2="8" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#C6362B" />
            <stop offset="1" stopColor="#EE7B2C" />
          </linearGradient>
        </defs>
        <path d="M4 11.5 C4 7.9 7 5 10.7 5 H19" stroke="url(#arrowGrad)" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <path d="M15.5 1.5 L19.5 5 L15.5 8.5" stroke="url(#arrowGrad)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M26 18.5 C26 22.1 23 25 19.3 25 H11" stroke="url(#arrowGrad)" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <path d="M14.5 28.5 L10.5 25 L14.5 21.5" stroke="url(#arrowGrad)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <div className="logo-text">
        <div className="wordmark">
          <span className="penta">PENTA</span><span className="peaks">PEAKS</span>
        </div>
        <div className="eyebrow">TRADE PORTAL</div>
      </div>
    </div>
  );
}
