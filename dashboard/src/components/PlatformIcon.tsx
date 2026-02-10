import { 
  Mail, 
  Linkedin, 
  MessageCircle, 
  Twitter, 
  Github, 
  MessageSquare,
  Globe,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlatformIconProps {
  platform: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const platformConfig: Record<string, { icon: LucideIcon; color: string }> = {
  email: { icon: Mail, color: 'text-blue-500' },
  linkedin: { icon: Linkedin, color: 'text-sky-600' },
  reddit: { icon: MessageCircle, color: 'text-orange-500' },
  twitter: { icon: Twitter, color: 'text-slate-600' },
  github: { icon: Github, color: 'text-slate-700' },
  discord: { icon: MessageSquare, color: 'text-indigo-500' },
};

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

export function PlatformIcon({ platform, className, size = 'md' }: PlatformIconProps) {
  const config = platformConfig[platform.toLowerCase()] || { icon: Globe, color: 'text-muted-foreground' };
  const Icon = config.icon;
  
  return (
    <Icon className={cn(sizeClasses[size], config.color, className)} />
  );
}

// For backwards compatibility - returns a simple letter/symbol instead of emoji
export function getPlatformSymbol(platform: string): string {
  switch (platform.toLowerCase()) {
    case 'email': return 'E';
    case 'linkedin': return 'in';
    case 'reddit': return 'R';
    case 'twitter': return 'X';
    case 'github': return 'GH';
    case 'discord': return 'D';
    default: return '•';
  }
}
