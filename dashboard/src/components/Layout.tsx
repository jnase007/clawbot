import { Outlet, NavLink, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Rocket, 
  ScrollText,
  BarChart3,
  Settings,
  ChevronLeft,
  Brain,
  HelpCircle,
  Bell,
  CheckCircle,
  AlertTriangle,
  Zap,
  X,
  Workflow,
  Inbox
} from 'lucide-react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { ClientSelector } from './ClientSelector';
import { useClient } from './ClientProvider';

// Integration status indicator
function IntegrationStatus() {
  const integrations = [
    { name: 'OpenAI', status: 'connected', icon: '🤖' },
    { name: 'Email', status: 'connected', icon: '📧' },
    { name: 'LinkedIn', status: 'pending', icon: '💼' },
  ];

  return (
    <div className="px-4 py-3 border-t border-border">
      <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider">Integrations</p>
      <div className="space-y-1.5">
        {integrations.map((int) => (
          <div key={int.name} className="flex items-center gap-2 text-xs">
            <span>{int.icon}</span>
            <span className="flex-1 text-muted-foreground">{int.name}</span>
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              int.status === 'connected' ? "bg-green-500" : "bg-yellow-500"
            )} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Help tooltip modal
function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold">Welcome to ClawBot</h2>
              <p className="text-sm text-muted-foreground">Your AI-powered outreach engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <span className="text-lg">1</span>
            </div>
            <div>
              <p className="font-medium">Select a Client</p>
              <p className="text-sm text-muted-foreground">Choose a client from the dropdown to view their dashboard and data.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
              <span className="text-lg">2</span>
            </div>
            <div>
              <p className="font-medium">Generate AI Strategy</p>
              <p className="text-sm text-muted-foreground">Use the AI Strategy page to auto-generate goals and templates based on the client's industry.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
              <span className="text-lg">3</span>
            </div>
            <div>
              <p className="font-medium">Add Contacts</p>
              <p className="text-sm text-muted-foreground">Import or add contacts for the client's outreach campaigns.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <span className="text-lg">4</span>
            </div>
            <div>
              <p className="font-medium">Launch Campaigns</p>
              <p className="text-sm text-muted-foreground">Create and launch automated outreach campaigns across email, LinkedIn, and Reddit.</p>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-border bg-secondary/30 rounded-b-2xl">
          <p className="text-xs text-muted-foreground text-center">
            Need help? Check the documentation or contact support.
          </p>
        </div>
      </div>
    </div>
  );
}

// Notifications dropdown
function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const notifications = [
    { id: 1, type: 'success', message: 'EquityMD campaign completed', time: '2 hours ago' },
    { id: 2, type: 'warning', message: 'LinkedIn API rate limit at 80%', time: '4 hours ago' },
    { id: 3, type: 'info', message: 'New templates generated for Brandastic', time: '1 day ago' },
  ];

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
      >
        <Bell className="w-4 h-4 text-muted-foreground" />
        <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
      </button>
      
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <p className="font-medium text-sm">Notifications</p>
              <button className="text-xs text-primary hover:underline">Mark all read</button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-3 hover:bg-secondary/50 transition-colors border-b border-border last:border-0">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                      notif.type === 'success' && "bg-green-500/10",
                      notif.type === 'warning' && "bg-yellow-500/10",
                      notif.type === 'info' && "bg-blue-500/10"
                    )}>
                      {notif.type === 'success' && <CheckCircle className="w-3 h-3 text-green-500" />}
                      {notif.type === 'warning' && <AlertTriangle className="w-3 h-3 text-yellow-500" />}
                      {notif.type === 'info' && <Zap className="w-3 h-3 text-blue-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{notif.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/strategy', icon: Brain, label: 'AI Strategy', highlight: true },
  { to: '/dashboard/contacts', icon: Users, label: 'Contacts' },
  { to: '/dashboard/templates', icon: FileText, label: 'Templates' },
  { to: '/dashboard/sequences', icon: Workflow, label: 'Sequences', isNew: true },
  { to: '/dashboard/campaigns', icon: Rocket, label: 'Campaigns' },
  { to: '/dashboard/inbox', icon: Inbox, label: 'Inbox', isNew: true },
  { to: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/dashboard/logs', icon: ScrollText, label: 'Activity' },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showHelp, setShowHelp] = useState(false);
  const { currentClient } = useClient();

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
          <Link to="/" className="block hover:opacity-80 transition-opacity">
            {collapsed ? (
              <Logo size="sm" showText={false} />
            ) : (
              <div>
                <Logo size="md" showText={true} />
                <p className="text-[10px] text-muted-foreground mt-2 px-1">
                  Agency AI Outreach Engine
                </p>
              </div>
            )}
          </Link>
        </div>

        {/* Current Client Indicator */}
        {!collapsed && currentClient && (
          <div className="px-5 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div 
                className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: currentClient.primary_color || '#3B82F6' }}
              >
                {currentClient.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{currentClient.name}</p>
                <p className="text-[10px] text-muted-foreground">Active Client</p>
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

        {/* Integration Status */}
        {!collapsed && <IntegrationStatus />}

        {/* Footer */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 border-t border-border",
          collapsed ? "p-2" : "p-4"
        )}>
          {!collapsed && (
            <p className="text-[10px] text-muted-foreground text-center mb-3">
              Agency Internal Tool · v2.0
            </p>
          )}
          <button
            onClick={() => setShowHelp(true)}
            className={cn(
              "w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary/50 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors",
              collapsed && "justify-center px-2"
            )}
          >
            <HelpCircle className="w-4 h-4" />
            {!collapsed && <span className="text-xs">Help & Guide</span>}
          </button>
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
            <div className="flex items-center gap-6">
              <ClientSelector />
              <div className="hidden md:block">
                <p className="text-xs text-muted-foreground">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-500 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-soft" />
                <span>Online</span>
              </div>
              <NotificationsDropdown />
              <ThemeToggle />
              <button 
                onClick={() => setShowHelp(true)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                title="Help"
              >
                <HelpCircle className="w-4 h-4 text-muted-foreground" />
              </button>
              <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <Settings className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Help Modal */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
