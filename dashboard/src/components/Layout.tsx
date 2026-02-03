import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Rocket, 
  ScrollText,
  ExternalLink,
  BarChart3,
  Settings,
  ChevronLeft,
  Activity,
  Sparkles
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/contacts', icon: Users, label: 'Contacts' },
  { to: '/templates', icon: FileText, label: 'Templates' },
  { to: '/campaigns', icon: Rocket, label: 'Campaigns' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/logs', icon: ScrollText, label: 'Activity' },
];

export default function Layout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-pattern">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 h-full bg-card/95 backdrop-blur-xl border-r border-border z-50 transition-all duration-300",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
            {!collapsed && (
              <div className="animate-fade-in">
                <h1 className="font-display font-bold text-lg gradient-text">
                  ClawBot
                </h1>
                <p className="text-[10px] text-muted-foreground">
                  Marketing Automation
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        {!collapsed && (
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-soft" />
              <span className="text-muted-foreground">System Online</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-3 flex-1">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group',
                      collapsed ? 'justify-center' : '',
                      isActive 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn(
                        "w-5 h-5 transition-transform group-hover:scale-105",
                        isActive && "text-primary"
                      )} />
                      {!collapsed && (
                        <span className="font-medium text-sm">
                          {item.label}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors"
        >
          <ChevronLeft className={cn(
            "w-3 h-3 transition-transform",
            collapsed && "rotate-180"
          )} />
        </button>

        {/* Footer */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 p-4 border-t border-border",
          collapsed && "p-2"
        )}>
          <a
            href="https://projecthunter.ai"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary/50 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors group",
              collapsed && "justify-center px-2"
            )}
          >
            <Activity className="w-4 h-4" />
            {!collapsed && (
              <>
                <span className="text-xs">projecthunter.ai</span>
                <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </>
            )}
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-300",
        collapsed ? "ml-20" : "ml-64"
      )}>
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-semibold capitalize">
                {location.pathname === '/' ? 'Dashboard' : location.pathname.slice(1)}
              </h2>
              <p className="text-xs text-muted-foreground">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-500 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-soft" />
                <span>Connected</span>
              </div>
              <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <Settings className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
