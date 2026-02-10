import { cn } from '@/lib/utils';

// Brandastic logo URL from Supabase storage
const LOGO_URL = 'https://ndrhfhdsmjrixxbarymj.supabase.co/storage/v1/object/public/Image/mark.png';

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
      {/* Logo Image */}
      <img 
        src={LOGO_URL}
        alt="ClawBot Logo"
        className="rounded-lg object-cover"
        style={{ width: s.icon, height: s.icon }}
      />
      
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

// Icon-only version for smaller displays
export function LogoIcon({ className }: { className?: string }) {
  return (
    <img 
      src={LOGO_URL}
      alt="ClawBot"
      className={cn("rounded-lg object-cover", className)}
    />
  );
}
