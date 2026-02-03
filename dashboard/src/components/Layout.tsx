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
  Zap,
  Settings,
  ChevronLeft,
  Terminal,
  Cpu,
  Activity
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Command Center' },
  { to: '/contacts', icon: Users, label: 'Targets' },
  { to: '/templates', icon: FileText, label: 'Payloads' },
  { to: '/campaigns', icon: Rocket, label: 'Missions' },
  { to: '/analytics', icon: BarChart3, label: 'Intel' },
  { to: '/logs', icon: ScrollText, label: 'Logs' },
];


export default function Layout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemStatus, setSystemStatus] = useState({ cpu: 23, mem: 45, active: true });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setSystemStatus({
        cpu: 20 + Math.random() * 15,
        mem: 40 + Math.random() * 20,
        active: true,
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen cyber-grid hex-pattern relative overflow-hidden">
      {/* Matrix background effect */}
      <div className="matrix-bg" />
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 h-full bg-card/90 backdrop-blur-xl border-r border-primary/20 z-50 transition-all duration-300",
          collapsed ? "w-20" : "w-72"
        )}
      >
        {/* Logo Section */}
        <div className="p-4 border-b border-primary/20">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-green animate-pulse-glow">
                <Cpu className="w-6 h-6 text-background" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
            </div>
            {!collapsed && (
              <div className="animate-slide-in-left">
                <h1 className="font-display font-bold text-xl text-primary text-glow-green">
                  CLAWBOT
                </h1>
                <p className="text-[10px] text-muted-foreground font-mono">
                  v2.0.0 // OPERATIONAL
                </p>
              </div>
            )}
          </div>
        </div>

        {/* System Status */}
        {!collapsed && (
          <div className="p-4 border-b border-primary/10">
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>SYSTEM STATUS</span>
                <span className="text-primary animate-pulse">● ONLINE</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-primary" />
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${systemStatus.cpu}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground w-8">
                  {systemStatus.cpu.toFixed(0)}%
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                {currentTime.toLocaleTimeString()} UTC
              </div>
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
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden',
                      collapsed ? 'justify-center' : '',
                      isActive 
                        ? 'bg-primary/10 text-primary glow-green' 
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r" />
                      )}
                      <item.icon className={cn(
                        "w-5 h-5 transition-transform group-hover:scale-110",
                        isActive && "animate-pulse-glow"
                      )} />
                      {!collapsed && (
                        <span className="font-medium text-sm tracking-wide">
                          {item.label}
                        </span>
                      )}
                      {isActive && !collapsed && (
                        <Zap className="w-3 h-3 ml-auto text-primary animate-pulse" />
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
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-card border border-primary/30 rounded-full flex items-center justify-center text-primary hover:bg-primary hover:text-background transition-colors"
        >
          <ChevronLeft className={cn(
            "w-4 h-4 transition-transform",
            collapsed && "rotate-180"
          )} />
        </button>

        {/* Footer */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 p-4 border-t border-primary/10",
          collapsed && "p-2"
        )}>
          <a
            href="https://projecthunter.ai"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 text-sm text-muted-foreground hover:text-primary transition-colors group",
              collapsed && "justify-center px-2"
            )}
          >
            <Terminal className="w-4 h-4 group-hover:animate-pulse" />
            {!collapsed && (
              <>
                <span className="font-mono text-xs">projecthunter.ai</span>
                <ExternalLink className="w-3 h-3 ml-auto" />
              </>
            )}
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-300 relative z-10",
        collapsed ? "ml-20" : "ml-72"
      )}>
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-primary/10 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                <span className="text-primary">$</span>
                <span>clawbot</span>
                <span className="text-primary">/</span>
                <span className="text-foreground">
                  {location.pathname === '/' ? 'dashboard' : location.pathname.slice(1)}
                </span>
                <span className="cursor" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs font-mono">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-muted-foreground">All systems operational</span>
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
