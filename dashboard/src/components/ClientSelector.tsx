import { useClient } from './ClientProvider';
import { cn } from '@/lib/utils';
import { Building2, ChevronDown, Plus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function ClientSelector() {
  const { clients, currentClient, setCurrentClientId, loading } = useClient();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="h-10 w-48 rounded-lg bg-secondary animate-pulse" />
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-3 px-4 py-2 rounded-lg border transition-all duration-200 min-w-[200px]",
          open 
            ? "border-primary bg-primary/5" 
            : "border-border bg-secondary/50 hover:border-primary/50"
        )}
      >
        {currentClient ? (
          <>
            {currentClient.logo_url ? (
              <img 
                src={currentClient.logo_url} 
                alt={currentClient.name}
                className="w-8 h-8 rounded-lg object-cover"
              />
            ) : (
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: currentClient.primary_color || '#3B82F6' }}
              >
                {currentClient.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 text-left">
              <p className="text-sm font-medium truncate max-w-[120px]">
                {currentClient.name}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {currentClient.industry || 'Active Client'}
              </p>
            </div>
          </>
        ) : (
          <>
            <Building2 className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Select Client</span>
          </>
        )}
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground transition-transform",
          open && "rotate-180"
        )} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in">
          <div className="p-2 border-b border-border">
            <p className="text-xs text-muted-foreground px-2 py-1">
              Select a client to view their data
            </p>
          </div>
          
          <div className="max-h-64 overflow-y-auto p-2">
            {clients.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No clients yet
              </p>
            ) : (
              clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => {
                    setCurrentClientId(client.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                    client.id === currentClient?.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-secondary"
                  )}
                >
                  {client.logo_url ? (
                    <img 
                      src={client.logo_url} 
                      alt={client.name}
                      className="w-8 h-8 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ backgroundColor: client.primary_color || '#3B82F6' }}
                    >
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{client.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {client.industry || 'No industry set'}
                      {client.preferred_channels?.length > 0 && (
                        <> · {client.preferred_channels.slice(0, 2).join(', ')}</>
                      )}
                    </p>
                  </div>
                  {client.id === currentClient?.id && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>
              ))
            )}
          </div>

          <div className="p-2 border-t border-border">
            <button
              onClick={() => {
                // TODO: Open add client modal
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New Client
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for sidebar
export function ClientSelectorCompact() {
  const { currentClient } = useClient();
  
  if (!currentClient) return null;
  
  return (
    <div 
      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
      style={{ backgroundColor: currentClient.primary_color || '#3B82F6' }}
      title={currentClient.name}
    >
      {currentClient.name.charAt(0).toUpperCase()}
    </div>
  );
}
