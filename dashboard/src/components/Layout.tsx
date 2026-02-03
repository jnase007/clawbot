import { Outlet, NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Rocket, 
  ScrollText,
  ExternalLink,
  BarChart3
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/contacts', icon: Users, label: 'Contacts' },
  { to: '/templates', icon: FileText, label: 'Templates' },
  { to: '/campaigns', icon: Rocket, label: 'Campaigns' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/logs', icon: ScrollText, label: 'Logs' },
];

export default function Layout() {
  return (
    <div className="min-h-screen grid-pattern">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-card/80 backdrop-blur-sm border-r border-border">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center text-xl">
              🦀
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">ClawBot</h1>
              <p className="text-xs text-muted-foreground">Marketing Outreach</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                      'hover:bg-secondary/50',
                      isActive 
                        ? 'bg-gradient-to-r from-amber-500/20 to-red-500/20 text-amber-400 border border-amber-500/30' 
                        : 'text-muted-foreground'
                    )
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <a
            href="https://projecthunter.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-red-500/10 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <img 
              src="/favicon.svg" 
              alt="" 
              className="w-5 h-5"
            />
            <span>ProjectHunter.ai</span>
            <ExternalLink className="w-3 h-3 ml-auto" />
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
