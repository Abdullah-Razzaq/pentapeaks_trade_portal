import React from 'react';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = '' }: LogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <img src="/logo.webp" alt="Pentapeaks Logo" className="max-h-12 w-auto object-contain" />
    </div>
  );
}
