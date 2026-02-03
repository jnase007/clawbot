import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getPlatformIcon(platform: string): string {
  switch (platform) {
    case 'email': return '📧';
    case 'linkedin': return '💼';
    case 'reddit': return '🔴';
    default: return '📌';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending': return 'text-muted-foreground';
    case 'sent': return 'text-blue-400';
    case 'engaged': return 'text-green-400';
    case 'replied': return 'text-amber-400';
    case 'unsubscribed': return 'text-gray-500';
    case 'bounced': return 'text-red-400';
    default: return 'text-foreground';
  }
}
