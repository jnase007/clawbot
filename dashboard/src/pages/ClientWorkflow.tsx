import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Building2, ChevronRight, Plus, Search,
  ClipboardList, Target, Rocket, TrendingUp, ArrowRight
} from 'lucide-react';

type Stage = 'discovery' | 'strategy' | 'execution' | 'optimization';

interface Client {
  id: string;
  name: string;
  company: string;
  industry: string;
  stage: Stage;
  status: 'active' | 'prospect' | 'paused';
  lastActivity: string;
}

const sampleClients: Client[] = [
  { id: '1', name: 'John Smith', company: 'Smile Dental Group', industry: 'Dental', stage: 'strategy', status: 'active', lastActivity: '2 hours ago' },
  { id: '2', name: 'Sarah Johnson', company: 'Pacific Dental Care', industry: 'Dental', stage: 'discovery', status: 'prospect', lastActivity: '1 day ago' },
  { id: '3', name: 'Michael Chen', company: 'HealthFirst Clinic', industry: 'Healthcare', stage: 'execution', status: 'active', lastActivity: '3 hours ago' },
  { id: '4', name: 'Emily Davis', company: 'Coastal Orthodontics', industry: 'Dental', stage: 'optimization', status: 'active', lastActivity: '5 hours ago' },
  { id: '5', name: 'Robert Wilson', company: 'Family Dental Practice', industry: 'Dental', stage: 'discovery', status: 'prospect', lastActivity: '2 days ago' },
];

const stages: { id: Stage; label: string; icon: typeof ClipboardList; color: string; bgColor: string }[] = [
  { id: 'discovery', label: 'Discovery', icon: ClipboardList, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  { id: 'strategy', label: 'Strategy', icon: Target, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  { id: 'execution', label: 'Execution', icon: Rocket, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  { id: 'optimization', label: 'Optimization', icon: TrendingUp, color: 'text-green-400', bgColor: 'bg-green-500/20' },
];

export default function ClientWorkflow() {
  const [clients] = useState<Client[]>(sampleClients);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<Stage | 'all'>('all');

  const getClientsForStage = (stage: Stage) => 
    clients.filter(c => c.stage === stage);

  const filteredClients = clients.filter(client => {
    const matchesSearch = !searchQuery || 
      client.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = selectedStage === 'all' || client.stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Users className="w-8 h-8 text-cyan-500" />
              Client Workflow
            </h1>
            <p className="text-muted-foreground mt-1">Manage clients through Discovery → Strategy → Execution</p>
          </div>
          <Link 
            to="/dashboard/discovery"
            className="px-4 py-2 bg-cyan-600 text-foreground rounded-lg hover:bg-cyan-500 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Client Discovery
          </Link>
        </div>

        {/* Pipeline Overview */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {stages.map((stage, idx) => (
            <div key={stage.id} className="relative">
              <div 
                className={`${stage.bgColor} rounded-xl p-4 border border-border cursor-pointer hover:border-slate-500 transition-colors`}
                onClick={() => setSelectedStage(selectedStage === stage.id ? 'all' : stage.id)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <stage.icon className={`w-5 h-5 ${stage.color}`} />
                  <span className="text-foreground font-semibold">{stage.label}</span>
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {getClientsForStage(stage.id).length}
                </div>
                <div className="text-sm text-muted-foreground">clients</div>
              </div>
              {idx < stages.length - 1 && (
                <ChevronRight className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-600 z-10" />
              )}
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients..."
              className="w-full pl-10 pr-4 py-3 bg-card text-foreground rounded-xl border border-border focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 bg-card p-1 rounded-xl">
            <button
              onClick={() => setSelectedStage('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedStage === 'all' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            {stages.map((stage) => (
              <button
                key={stage.id}
                onClick={() => setSelectedStage(stage.id)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedStage === stage.id ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {stage.label}
              </button>
            ))}
          </div>
        </div>

        {/* Client List */}
        <div className="bg-card backdrop-blur rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Client</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Company</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Industry</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Stage</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Last Activity</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredClients.map((client) => {
                const stage = stages.find(s => s.id === client.stage)!;
                return (
                  <tr key={client.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-foreground font-semibold text-sm">
                          {client.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-foreground font-medium">{client.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        {client.company}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{client.industry}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${stage.bgColor} ${stage.color}`}>
                        <stage.icon className="w-3 h-3" />
                        {stage.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        client.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        client.status === 'prospect' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-muted-foreground'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-sm">{client.lastActivity}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {client.stage === 'discovery' && (
                          <Link 
                            to="/dashboard/discovery"
                            className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1"
                          >
                            Start Discovery <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                        {client.stage === 'strategy' && (
                          <Link 
                            to="/dashboard/strategy"
                            className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                          >
                            Generate Strategy <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                        {(client.stage === 'execution' || client.stage === 'optimization') && (
                          <Link 
                            to="/dashboard/campaigns"
                            className="text-orange-400 hover:text-orange-300 text-sm flex items-center gap-1"
                          >
                            View Campaigns <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                        <button className="text-muted-foreground hover:text-foreground text-sm">
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Workflow Steps */}
        <div className="mt-8 bg-card/30 rounded-xl p-6 border border-border">
          <h3 className="text-foreground font-semibold mb-4">Workflow Process</h3>
          <div className="grid grid-cols-4 gap-4">
            {stages.map((stage) => (
              <div key={stage.id} className="relative">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full ${stage.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <stage.icon className={`w-4 h-4 ${stage.color}`} />
                  </div>
                  <div>
                    <h4 className="text-foreground font-medium">{stage.label}</h4>
                    <p className="text-muted-foreground text-sm mt-1">
                      {stage.id === 'discovery' && 'Gather client info, goals, and pain points'}
                      {stage.id === 'strategy' && 'AI generates marketing strategy'}
                      {stage.id === 'execution' && 'Launch campaigns and content'}
                      {stage.id === 'optimization' && 'Analyze results and improve'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CLI Hint */}
        <div className="mt-6 bg-card/30 rounded-xl p-4 border border-border">
          <p className="text-muted-foreground text-sm">
            💡 <span className="text-foreground">CLI commands:</span>
          </p>
          <div className="flex gap-4 mt-2">
            <code className="text-cyan-400 font-mono text-sm bg-background px-3 py-2 rounded-lg">
              clawbot clients create
            </code>
            <code className="text-cyan-400 font-mono text-sm bg-background px-3 py-2 rounded-lg">
              clawbot clients strategy --id &lt;id&gt;
            </code>
            <code className="text-cyan-400 font-mono text-sm bg-background px-3 py-2 rounded-lg">
              clawbot clients pipeline
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
