import { useState, useEffect } from 'react';
import { 
  Target, Search, Users, Building2, Mail, Linkedin,
  Loader2, AlertCircle, Download, RefreshCw, Check, Filter,
  MapPin, ChevronDown, Info
} from 'lucide-react';
import { useClient } from '@/components/ClientProvider';
import { CLIENT_PRESETS } from '@/lib/types';

interface Lead {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  title: string;
  company: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  location?: string;
  industry?: string;
  companySize?: number;
  companyWebsite?: string;
}

interface SearchFilters {
  query: string;
  titles: string[];
  industries: string[];
  locations: string[];
  companySize: string;
}

const API_URL = '/api/apollo-search';

// Industry options grouped by client type
const industryOptions: Record<string, string[]> = {
  healthcare: [
    'Hospital & Health Care',
    'Medical Practice',
    'Medical Devices',
    'Health, Wellness and Fitness',
    'Mental Health Care',
    'Pharmaceuticals',
  ],
  realestate: [
    'Real Estate',
    'Investment Banking',
    'Venture Capital & Private Equity',
    'Financial Services',
    'Banking',
    'Wealth Management',
  ],
  construction: [
    'Construction',
    'Building Materials',
    'Architecture & Planning',
    'Civil Engineering',
    'Real Estate Development',
  ],
  technology: [
    'Information Technology & Services',
    'Computer Software',
    'Financial Services',
    'Banking',
    'Insurance',
  ],
  marketing: [
    'Hospital & Health Care',
    'Medical Practice',
    'Real Estate',
    'Technology',
    'E-commerce',
    'Professional Services',
  ],
};

const companySizes = [
  { value: '', label: 'Any size' },
  { value: '1,10', label: '1-10 employees' },
  { value: '11,50', label: '11-50 employees' },
  { value: '51,200', label: '51-200 employees' },
  { value: '201,500', label: '201-500 employees' },
  { value: '501,1000', label: '501-1000 employees' },
  { value: '1001,5000', label: '1001-5000 employees' },
];

// Get preset key from client name
function getPresetKey(clientName?: string | null): string | null {
  if (!clientName) return null;
  const name = clientName.toLowerCase();
  if (name.includes('equitymd') || name.includes('equity')) return 'equitymd';
  if (name.includes('projecthunter') || name.includes('hunter')) return 'projecthunter';
  if (name.includes('comply')) return 'comply';
  if (name.includes('brandastic')) return 'brandastic';
  return null;
}

export default function ApolloLeads() {
  const { currentClient } = useClient();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(true);
  
  // Get client-specific defaults
  const presetKey = getPresetKey(currentClient?.name);
  const preset = presetKey ? CLIENT_PRESETS[presetKey] : null;
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    titles: preset?.target_job_titles || currentClient?.target_job_titles || ['Marketing Director', 'CMO', 'Marketing Manager'],
    industries: preset?.target_industries || currentClient?.target_industries || ['Hospital & Health Care', 'Medical Practice'],
    locations: preset?.target_locations || currentClient?.target_locations || ['United States'],
    companySize: '',
  });

  // Get available industries based on client
  const getAvailableIndustries = () => {
    if (preset?.target_industries) return preset.target_industries;
    if (currentClient?.target_industries) return currentClient.target_industries;
    // Determine by client type
    const name = currentClient?.name?.toLowerCase() || '';
    if (name.includes('equity')) return industryOptions.realestate;
    if (name.includes('hunter')) return industryOptions.construction;
    if (name.includes('comply')) return industryOptions.technology;
    return industryOptions.marketing;
  };

  // Get available job titles
  const getAvailableTitles = () => {
    if (preset?.target_job_titles) return preset.target_job_titles;
    if (currentClient?.target_job_titles) return currentClient.target_job_titles;
    return ['Marketing Director', 'CMO', 'Chief Marketing Officer', 'VP of Marketing', 'Director of Marketing'];
  };

  // Update filters when client changes
  useEffect(() => {
    const newPresetKey = getPresetKey(currentClient?.name);
    const newPreset = newPresetKey ? CLIENT_PRESETS[newPresetKey] : null;
    
    setFilters({
      query: '',
      titles: newPreset?.target_job_titles || currentClient?.target_job_titles || ['Marketing Director', 'CMO'],
      industries: newPreset?.target_industries || currentClient?.target_industries || ['Hospital & Health Care'],
      locations: newPreset?.target_locations || currentClient?.target_locations || ['United States'],
      companySize: '',
    });
    setLeads([]);
    setTotalResults(0);
  }, [currentClient?.id]);

  const handleSearch = async () => {
    setIsSearching(true);
    setError(null);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: filters.query,
          titles: filters.titles,
          industries: filters.industries,
          locations: filters.locations,
          companySize: filters.companySize,
          limit: 25,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Search failed');
      }

      const data = await response.json();
      setLeads(data.leads || []);
      setTotalResults(data.total || 0);
      setSelectedLeads(new Set());

    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search leads');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleTitle = (title: string) => {
    setFilters(prev => ({
      ...prev,
      titles: prev.titles.includes(title)
        ? prev.titles.filter(t => t !== title)
        : [...prev.titles, title],
    }));
  };

  const toggleIndustry = (industry: string) => {
    setFilters(prev => ({
      ...prev,
      industries: prev.industries.includes(industry)
        ? prev.industries.filter(i => i !== industry)
        : [...prev.industries, industry],
    }));
  };

  const toggleLead = (id: string) => {
    setSelectedLeads(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads.map(l => l.id)));
    }
  };

  const exportLeads = () => {
    const selectedData = leads.filter(l => selectedLeads.has(l.id));
    if (selectedData.length === 0) return;
    
    const csv = [
      ['Name', 'Title', 'Company', 'Email', 'Phone', 'LinkedIn', 'Location', 'Industry'].join(','),
      ...selectedData.map(l => [
        l.name,
        l.title,
        l.company,
        l.email || '',
        l.phone || '',
        l.linkedin || '',
        l.location || '',
        l.industry || '',
      ].map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apollo-leads-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <Target className="w-7 h-7 text-orange-500" />
              Apollo Lead Search
            </h1>
            <p className="text-gray-400 mt-1">
              {currentClient 
                ? `Finding leads for ${currentClient.name}` 
                : 'Select a client to customize your search'}
            </p>
          </div>
          
          {selectedLeads.size > 0 && (
            <button
              onClick={exportLeads}
              className="mt-4 md:mt-0 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export {selectedLeads.size} Leads
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Panel */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/70 rounded-xl border border-slate-700 overflow-hidden">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full p-4 flex items-center justify-between text-white font-semibold lg:cursor-default"
              >
                <span className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Search Filters
                </span>
                <ChevronDown className={`w-4 h-4 lg:hidden transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              <div className={`${showFilters ? 'block' : 'hidden lg:block'} p-4 pt-0 space-y-5`}>
                {/* Keyword Search */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Keywords</label>
                  <input
                    type="text"
                    value={filters.query}
                    onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                    placeholder="e.g., dental, orthodontics"
                    className="w-full px-3 py-2 bg-slate-900/50 text-white rounded-lg border border-slate-600 focus:border-orange-500 focus:outline-none text-sm"
                  />
                </div>

                {/* Client Context Alert */}
                {currentClient && (
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-orange-400 text-sm font-medium mb-1">
                      <Info className="w-4 h-4" />
                      Targeting for {currentClient.name}
                    </div>
                    <p className="text-xs text-gray-400">
                      Filters are preset for {preset?.industry || currentClient.industry || 'this client'}
                    </p>
                  </div>
                )}

                {/* Job Titles */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Job Titles</label>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {getAvailableTitles().map(title => (
                      <label key={title} className="flex items-center gap-2 cursor-pointer hover:bg-slate-700/50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={filters.titles.includes(title)}
                          onChange={() => toggleTitle(title)}
                          className="rounded border-slate-500"
                        />
                        <span className="text-sm text-gray-300">{title}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Industries */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Industries</label>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {getAvailableIndustries().map(industry => (
                      <label key={industry} className="flex items-center gap-2 cursor-pointer hover:bg-slate-700/50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={filters.industries.includes(industry)}
                          onChange={() => toggleIndustry(industry)}
                          className="rounded border-slate-500"
                        />
                        <span className="text-sm text-gray-300">{industry}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Company Size */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Company Size</label>
                  <select
                    value={filters.companySize}
                    onChange={(e) => setFilters(prev => ({ ...prev, companySize: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900/50 text-white rounded-lg border border-slate-600 focus:border-orange-500 focus:outline-none text-sm"
                  >
                    {companySizes.map(size => (
                      <option key={size.value} value={size.value}>{size.label}</option>
                    ))}
                  </select>
                </div>

                {/* Search Button */}
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-500 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Search Leads
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-3">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-medium">Search Failed</p>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Results Header */}
            {leads.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedLeads.size === leads.length && leads.length > 0}
                      onChange={selectAll}
                      className="rounded border-slate-500"
                    />
                    <span className="text-sm text-gray-300">Select all</span>
                  </label>
                  <span className="text-sm text-gray-400">
                    {totalResults.toLocaleString()} results found
                  </span>
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
                >
                  <RefreshCw className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            )}

            {/* Leads List */}
            {leads.length > 0 ? (
              <div className="space-y-3">
                {leads.map(lead => (
                  <div
                    key={lead.id}
                    className={`bg-slate-800/70 rounded-xl p-4 border transition-colors cursor-pointer ${
                      selectedLeads.has(lead.id) 
                        ? 'border-orange-500 bg-orange-500/10' 
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                    onClick={() => toggleLead(lead.id)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-1 ${
                        selectedLeads.has(lead.id) ? 'bg-orange-500 border-orange-500' : 'border-slate-500'
                      }`}>
                        {selectedLeads.has(lead.id) && <Check className="w-3 h-3 text-white" />}
                      </div>

                      {/* Lead Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div>
                            <h3 className="text-white font-semibold">{lead.name}</h3>
                            <p className="text-gray-400 text-sm">{lead.title}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {lead.linkedin && (
                              <a
                                href={lead.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30"
                              >
                                <Linkedin className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Building2 className="w-4 h-4 shrink-0" />
                            <span className="truncate">{lead.company}</span>
                          </div>
                          {lead.email && (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Mail className="w-4 h-4 shrink-0" />
                              <span className="truncate">{lead.email}</span>
                            </div>
                          )}
                          {lead.location && (
                            <div className="flex items-center gap-2 text-gray-400">
                              <MapPin className="w-4 h-4 shrink-0" />
                              <span className="truncate">{lead.location}</span>
                            </div>
                          )}
                        </div>

                        {(lead.industry || lead.companySize) && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {lead.industry && (
                              <span className="px-2 py-1 bg-slate-700 rounded text-xs text-gray-300">
                                {lead.industry}
                              </span>
                            )}
                            {lead.companySize && (
                              <span className="px-2 py-1 bg-slate-700 rounded text-xs text-gray-300">
                                {lead.companySize.toLocaleString()} employees
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !isSearching && (
              <div className="bg-slate-800/50 rounded-xl p-12 border border-slate-700 text-center">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Leads Yet</h3>
                <p className="text-gray-400 mb-6">
                  Configure your filters and click "Search Leads" to find healthcare marketing decision-makers
                </p>
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-500 inline-flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Search Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
