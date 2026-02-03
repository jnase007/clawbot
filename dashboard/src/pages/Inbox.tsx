import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useClient } from '@/components/ClientProvider';
import { 
  Inbox as InboxIcon,
  Mail,
  Search,
  Star,
  StarOff,
  Archive,
  Reply,
  Clock,
  CheckCircle,
  Building2,
  Sparkles
} from 'lucide-react';
import { cn, getPlatformIcon, formatDate } from '@/lib/utils';

interface Message {
  id: string;
  platform: 'email' | 'linkedin' | 'reddit';
  from_name: string;
  from_handle: string;
  subject?: string;
  content: string;
  received_at: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  sentiment: 'positive' | 'neutral' | 'negative' | 'unknown';
  starred: boolean;
  contact_id?: string;
  thread_id?: string;
}

// Mock messages for demo
const mockMessages: Message[] = [
  {
    id: '1',
    platform: 'email',
    from_name: 'Sarah Johnson',
    from_handle: 'sarah@healthfund.com',
    subject: 'Re: Quick question about healthcare AI',
    content: 'Hi! Thanks for reaching out. I\'d love to learn more about what you\'re building. Can we schedule a call next week? I have availability on Tuesday or Wednesday afternoon.',
    received_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    status: 'unread',
    sentiment: 'positive',
    starred: true,
  },
  {
    id: '2',
    platform: 'linkedin',
    from_name: 'Mike Chen',
    from_handle: 'linkedin.com/in/mikechen',
    content: 'Thanks for connecting! I saw your message about AI agents. We\'re actually looking for solutions like this at our company. Would be great to chat.',
    received_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    status: 'unread',
    sentiment: 'positive',
    starred: false,
  },
  {
    id: '3',
    platform: 'email',
    from_name: 'Tom Williams',
    from_handle: 'tom@startup.io',
    subject: 'Re: Partnership opportunity',
    content: 'Not interested at this time, but feel free to reach out again in Q2 when we have more budget allocated for new tools.',
    received_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    status: 'read',
    sentiment: 'neutral',
    starred: false,
  },
  {
    id: '4',
    platform: 'reddit',
    from_name: 'u/developer_jane',
    from_handle: 'u/developer_jane',
    content: 'Hey, I saw your post about building AI agents. I\'ve been doing similar work. Would love to connect and share ideas!',
    received_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    status: 'read',
    sentiment: 'positive',
    starred: false,
  },
  {
    id: '5',
    platform: 'email',
    from_name: 'Delivery System',
    from_handle: 'mailer-daemon@email.com',
    subject: 'Delivery failed',
    content: 'Your message to invalid@example.com could not be delivered. The email address does not exist.',
    received_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    status: 'read',
    sentiment: 'negative',
    starred: false,
  },
];

export default function Inbox() {
  const { currentClientId, currentClient } = useClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred' | 'positive'>('all');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'email' | 'linkedin' | 'reddit'>('all');
  const [search, setSearch] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (currentClientId) {
      // For now, use mock data
      setMessages(mockMessages);
    }
  }, [currentClientId]);

  function markAsRead(id: string) {
    setMessages(messages.map(m => 
      m.id === id ? { ...m, status: 'read' as const } : m
    ));
  }

  function toggleStar(id: string) {
    setMessages(messages.map(m => 
      m.id === id ? { ...m, starred: !m.starred } : m
    ));
  }

  function archiveMessage(id: string) {
    setMessages(messages.map(m => 
      m.id === id ? { ...m, status: 'archived' as const } : m
    ));
  }

  const filteredMessages = messages.filter(m => {
    if (m.status === 'archived' && filter !== 'all') return false;
    if (filter === 'unread' && m.status !== 'unread') return false;
    if (filter === 'starred' && !m.starred) return false;
    if (filter === 'positive' && m.sentiment !== 'positive') return false;
    if (platformFilter !== 'all' && m.platform !== platformFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        m.from_name.toLowerCase().includes(q) ||
        m.from_handle.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q) ||
        m.subject?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    total: messages.length,
    unread: messages.filter(m => m.status === 'unread').length,
    positive: messages.filter(m => m.sentiment === 'positive').length,
    needsReply: messages.filter(m => m.status === 'unread' && m.sentiment === 'positive').length,
  };

  // No client selected
  if (!currentClientId || !currentClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Building2 className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold mb-2">Select a Client</h2>
        <p className="text-muted-foreground max-w-md">
          Choose a client from the dropdown above to view their inbox.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <InboxIcon className="w-8 h-8 text-primary" />
            Unified Inbox
          </h1>
          <p className="text-muted-foreground mt-1">
            All replies from all channels in one place
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Synced
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-hover cursor-pointer" onClick={() => setFilter('all')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <InboxIcon className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className={cn("card-hover cursor-pointer", filter === 'unread' && "border-primary")} onClick={() => setFilter('unread')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold text-blue-500">{stats.unread}</p>
              </div>
              <Mail className="w-5 h-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className={cn("card-hover cursor-pointer", filter === 'positive' && "border-primary")} onClick={() => setFilter('positive')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Positive</p>
                <p className="text-2xl font-bold text-green-500">{stats.positive}</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Needs Reply</p>
                <p className="text-2xl font-bold text-accent">{stats.needsReply}</p>
              </div>
              <Reply className="w-5 h-5 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={platformFilter} onValueChange={(v) => setPlatformFilter(v as typeof platformFilter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="email">📧 Email</TabsTrigger>
            <TabsTrigger value="linkedin">💼 LinkedIn</TabsTrigger>
            <TabsTrigger value="reddit">🔴 Reddit</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          variant={filter === 'starred' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter(filter === 'starred' ? 'all' : 'starred')}
          className="gap-1"
        >
          <Star className="w-4 h-4" />
          Starred
        </Button>
      </div>

      {/* Messages List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* List */}
        <Card className="lg:max-h-[600px] overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {filteredMessages.length} messages
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto max-h-[500px]">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-12">
                <InboxIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No messages found</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => {
                      setSelectedMessage(message);
                      if (message.status === 'unread') markAsRead(message.id);
                    }}
                    className={cn(
                      "p-4 cursor-pointer transition-colors hover:bg-secondary/50",
                      message.status === 'unread' && "bg-primary/5",
                      selectedMessage?.id === message.id && "bg-secondary"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg shrink-0">
                        {getPlatformIcon(message.platform)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-medium text-sm truncate",
                            message.status === 'unread' && "font-bold"
                          )}>
                            {message.from_name}
                          </span>
                          {message.sentiment === 'positive' && (
                            <Badge variant="success" className="text-[10px] px-1">Hot</Badge>
                          )}
                          {message.starred && (
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        {message.subject && (
                          <p className={cn(
                            "text-sm truncate",
                            message.status === 'unread' ? "font-medium" : "text-muted-foreground"
                          )}>
                            {message.subject}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {message.content}
                        </p>
                      </div>

                      {/* Time */}
                      <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatDate(message.received_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail View */}
        <Card className="lg:max-h-[600px] overflow-hidden">
          {selectedMessage ? (
            <>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-2xl">
                      {getPlatformIcon(selectedMessage.platform)}
                    </div>
                    <div>
                      <CardTitle>{selectedMessage.from_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{selectedMessage.from_handle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleStar(selectedMessage.id)}
                    >
                      {selectedMessage.starred ? (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <StarOff className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => archiveMessage(selectedMessage.id)}
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedMessage.subject && (
                  <div>
                    <p className="text-xs text-muted-foreground">Subject</p>
                    <p className="font-medium">{selectedMessage.subject}</p>
                  </div>
                )}
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(selectedMessage.received_at)}
                  </div>
                  <Badge 
                    variant={
                      selectedMessage.sentiment === 'positive' ? 'success' :
                      selectedMessage.sentiment === 'negative' ? 'destructive' : 'secondary'
                    }
                  >
                    {selectedMessage.sentiment}
                  </Badge>
                </div>

                <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                  <p className="text-sm whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 pt-4">
                  <Button className="flex-1 gap-2">
                    <Reply className="w-4 h-4" />
                    Reply
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI Draft
                  </Button>
                </div>

                {/* AI Suggested Reply */}
                {selectedMessage.sentiment === 'positive' && (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-green-500">AI Suggested Reply</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      "Thanks so much for your interest, {selectedMessage.from_name.split(' ')[0]}! I'd love to schedule a call. 
                      How does Tuesday at 2pm or Wednesday at 10am work for you? 
                      Here's my Calendly link: [link]"
                    </p>
                    <Button size="sm" variant="outline" className="mt-3 gap-1">
                      <Copy className="w-3 h-3" />
                      Copy
                    </Button>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-col items-center justify-center h-full py-16">
              <Mail className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Select a message to view</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

// Need to add Copy to imports
function Copy({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
    </svg>
  );
}
