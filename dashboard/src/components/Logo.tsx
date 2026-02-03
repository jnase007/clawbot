import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const sizes = {
    sm: { icon: 32, text: 'text-lg' },
    md: { icon: 40, text: 'text-xl' },
    lg: { icon: 56, text: 'text-2xl' },
  };

  const s = sizes[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Logo Icon */}
      <div 
        className="relative"
        style={{ width: s.icon, height: s.icon }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Background circle with gradient */}
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--accent))" />
            </linearGradient>
            <linearGradient id="clawGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.9" />
              <stop offset="100%" stopColor="white" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          
          {/* Main circle */}
          <circle cx="50" cy="50" r="46" fill="url(#logoGradient)" />
          
          {/* Left claw */}
          <path
            d="M25 55 C20 45, 22 35, 30 30 C35 27, 40 28, 42 32 L38 45 C36 50, 32 52, 28 50 Z"
            fill="url(#clawGradient)"
          />
          
          {/* Right claw */}
          <path
            d="M75 55 C80 45, 78 35, 70 30 C65 27, 60 28, 58 32 L62 45 C64 50, 68 52, 72 50 Z"
            fill="url(#clawGradient)"
          />
          
          {/* Body/head */}
          <ellipse cx="50" cy="52" rx="18" ry="16" fill="url(#clawGradient)" />
          
          {/* Left eye */}
          <circle cx="43" cy="48" r="4" fill="hsl(var(--primary))" />
          <circle cx="44" cy="47" r="1.5" fill="white" />
          
          {/* Right eye */}
          <circle cx="57" cy="48" r="4" fill="hsl(var(--primary))" />
          <circle cx="58" cy="47" r="1.5" fill="white" />
          
          {/* Bot antenna */}
          <line x1="50" y1="36" x2="50" y2="26" stroke="url(#clawGradient)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="50" cy="24" r="4" fill="url(#clawGradient)" />
          
          {/* Circuit lines */}
          <path
            d="M35 62 L35 68 L42 68"
            stroke="url(#clawGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
          <path
            d="M65 62 L65 68 L58 68"
            stroke="url(#clawGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>
      </div>
      
      {/* Text */}
      {showText && (
        <div>
          <h1 className={cn("font-display font-bold gradient-text", s.text)}>
            ClawBot
          </h1>
          <p className="text-[10px] text-muted-foreground -mt-0.5">
            Marketing Automation
          </p>
        </div>
      )}
    </div>
  );
}

// Favicon-friendly simple version
export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#iconGradient)" />
      <path d="M25 55 C20 45, 22 35, 30 30 C35 27, 40 28, 42 32 L38 45 C36 50, 32 52, 28 50 Z" fill="white" fillOpacity="0.9" />
      <path d="M75 55 C80 45, 78 35, 70 30 C65 27, 60 28, 58 32 L62 45 C64 50, 68 52, 72 50 Z" fill="white" fillOpacity="0.9" />
      <ellipse cx="50" cy="52" rx="18" ry="16" fill="white" fillOpacity="0.9" />
      <circle cx="43" cy="48" r="4" fill="#3B82F6" />
      <circle cx="57" cy="48" r="4" fill="#3B82F6" />
      <line x1="50" y1="36" x2="50" y2="26" stroke="white" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.9" />
      <circle cx="50" cy="24" r="4" fill="white" fillOpacity="0.9" />
    </svg>
  );
}
