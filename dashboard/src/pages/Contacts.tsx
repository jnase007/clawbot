import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { 
  Search, 
  Plus, 
  Mail, 
  Filter,
  MoreHorizontal,
  UserPlus
} from 'lucide-react';
import { cn, getPlatformIcon, getStatusColor, formatDate } from '@/lib/utils';
import type { OutreachContact, Platform } from '@/lib/types';

export default function Contacts() {
  const [contacts, setContacts] = useState<OutreachContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState<Platform | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Add contact form state
  const [newContact, setNewContact] = useState({
    platform: 'email' as Platform,
    handle: '',
    name: '',
    tags: '',
  });

  useEffect(() => {
    fetchContacts();
  }, [platform]);

  async function fetchContacts() {
    setLoading(true);
    try {
      let query = supabase
        .from('outreach_contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (platform !== 'all') {
        query = query.eq('platform', platform);
      }

      const { data, error } = await query;
      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addContact(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { error } = await supabase.from('outreach_contacts').insert({
        platform: newContact.platform,
        handle: newContact.handle,
        name: newContact.name || null,
        email: newContact.platform === 'email' ? newContact.handle : null,
        status: 'pending',
        tags: newContact.tags ? newContact.tags.split(',').map((t) => t.trim()) : [],
        notes: {},
        last_contacted: null,
      });

      if (error) throw error;

      setNewContact({ platform: 'email', handle: '', name: '', tags: '' });
      setShowAddModal(false);
      fetchContacts();
    } catch (error) {
      console.error('Error adding contact:', error);
    }
  }

  const filteredContacts = contacts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.handle.toLowerCase().includes(q) ||
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  const statusCounts = contacts.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your outreach contacts across all platforms
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Add Contact
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={platform} onValueChange={(v) => setPlatform(v as Platform | 'all')}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="email">📧 Email</TabsTrigger>
            <TabsTrigger value="linkedin">💼 LinkedIn</TabsTrigger>
            <TabsTrigger value="reddit">🔴 Reddit</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Status Overview */}
      <div className="flex gap-3">
        {Object.entries(statusCounts).map(([status, count]) => (
          <Badge key={status} variant="secondary" className="px-3 py-1">
            <span className={cn('mr-2', getStatusColor(status))}>●</span>
            {status}: {count}
          </Badge>
        ))}
      </div>

      {/* Contacts Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg">No contacts found</p>
              <p className="text-sm">Add your first contact to get started</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">Platform</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Contact</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Tags</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Last Contacted</th>
                  <th className="text-left p-4 font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => (
                  <tr 
                    key={contact.id} 
                    className="border-t border-border hover:bg-secondary/30 transition-colors"
                  >
                    <td className="p-4">
                      <span className="text-xl">{getPlatformIcon(contact.platform)}</span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{contact.name || contact.handle}</p>
                        {contact.name && (
                          <p className="text-sm text-muted-foreground">{contact.handle}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={
                        contact.status === 'engaged' || contact.status === 'replied' ? 'success' :
                        contact.status === 'sent' ? 'info' :
                        contact.status === 'bounced' || contact.status === 'unsubscribed' ? 'destructive' :
                        'secondary'
                      }>
                        {contact.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1 flex-wrap">
                        {contact.tags?.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {contact.tags?.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{contact.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {contact.last_contacted ? formatDate(contact.last_contacted) : '—'}
                    </td>
                    <td className="p-4">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Add Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addContact} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Platform</label>
                  <div className="flex gap-2">
                    {(['email', 'linkedin', 'reddit'] as Platform[]).map((p) => (
                      <Button
                        key={p}
                        type="button"
                        variant={newContact.platform === p ? 'default' : 'outline'}
                        onClick={() => setNewContact({ ...newContact, platform: p })}
                        className="flex-1"
                      >
                        {getPlatformIcon(p)} {p}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {newContact.platform === 'email' ? 'Email Address' :
                     newContact.platform === 'linkedin' ? 'Profile URL or Username' :
                     'Reddit Username'}
                  </label>
                  <Input
                    value={newContact.handle}
                    onChange={(e) => setNewContact({ ...newContact, handle: e.target.value })}
                    placeholder={
                      newContact.platform === 'email' ? 'user@example.com' :
                      newContact.platform === 'linkedin' ? 'linkedin.com/in/username' :
                      'u/username'
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Name (optional)</label>
                  <Input
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tags (comma-separated)</label>
                  <Input
                    value={newContact.tags}
                    onChange={(e) => setNewContact({ ...newContact, tags: e.target.value })}
                    placeholder="developer, ai, potential"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Add Contact
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
