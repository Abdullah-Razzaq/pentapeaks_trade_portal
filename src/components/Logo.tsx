type LogoProps = {
  className?: string;
};

/**
 * Placeholder import/export brand mark: a circular badge with two curved
 * arrows forming an exchange loop. Swap this out once the company name
 * and final branding are confirmed.
 */
export default function Logo({ className = "h-10 w-10" }: LogoProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill="url(#logo-gradient)" />
      <path d="M14 19.5c0-3.6 2.9-6.5 6.5-6.5H27" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M24.5 9.5l6 4-6 4" fill="#fff" />
      <path d="M34 28.5c0 3.6-2.9 6.5-6.5 6.5H21" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M23.5 38.5l-6-4 6-4" fill="#fff" />
    </svg>
  );
}
