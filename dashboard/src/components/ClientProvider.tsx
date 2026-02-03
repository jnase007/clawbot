import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Client } from '@/lib/types';

interface ClientContextType {
  clients: Client[];
  currentClient: Client | null;
  currentClientId: string | null;
  setCurrentClientId: (id: string | null) => void;
  loading: boolean;
  refreshClients: () => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [currentClientId, setCurrentClientIdState] = useState<string | null>(() => {
    return localStorage.getItem('clawbot-client-id');
  });
  const [loading, setLoading] = useState(true);

  const currentClient = clients.find(c => c.id === currentClientId) || null;

  const setCurrentClientId = (id: string | null) => {
    if (id) {
      localStorage.setItem('clawbot-client-id', id);
    } else {
      localStorage.removeItem('clawbot-client-id');
    }
    setCurrentClientIdState(id);
  };

  const refreshClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      setClients(data || []);
      
      // Auto-select first client if none selected
      if (!currentClientId && data && data.length > 0) {
        setCurrentClientId((data[0] as Client).id);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshClients();
  }, []);

  return (
    <ClientContext.Provider
      value={{
        clients,
        currentClient,
        currentClientId,
        setCurrentClientId,
        loading,
        refreshClients,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
}

// Helper hook for client-filtered queries
export function useClientQuery() {
  const { currentClientId } = useClient();
  
  return {
    clientId: currentClientId,
    // Helper to add client filter to any query
    withClientFilter: <T extends { eq: (column: string, value: string) => T }>(query: T): T => {
      if (currentClientId) {
        return query.eq('client_id', currentClientId);
      }
      return query;
    },
  };
}
