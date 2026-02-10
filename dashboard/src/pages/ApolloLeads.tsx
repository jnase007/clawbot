import { useState } from 'react';
import { Search, Users, Building2, Mail, Download, Filter, RefreshCw, Target } from 'lucide-react';

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  title: string;
  company: string;
  email: string | null;
  has_email: boolean;
  linkedin_url?: string;
  location?: string;
}

// Sample data for demo (in production, this would come from the API)
const sampleLeads: Lead[] = [
  { id: '1', first_name: 'Erik', last_name: 'Johnson', title: 'Chief Marketing Officer', company: 'Dental Associates', email: null, has_email: false, location: 'Los Angeles, CA' },
  { id: '2', first_name: 'Sarah', last_name: 'Miller', title: 'VP of Marketing', company: 'Smile Dental Group', email: 'sarah@smiledental.com', has_email: true, location: 'San Diego, CA' },
  { id: '3', first_name: 'Greg', last_name: 'Thompson', title: 'Chief Marketing Officer', company: 'Carestream Dental', email: null, has_email: false, location: 'Atlanta, GA' },
  { id: '4', first_name: 'Maria', last_name: 'Garcia', title: 'Marketing Director', company: 'Pacific Dental Services', email: 'mgarcia@pacificdental.com', has_email: true, location: 'Irvine, CA' },
  { id: '5', first_name: 'James', last_name: 'Wilson', title: 'CMO', company: 'Aspen Dental', email: null, has_email: false, location: 'Chicago, IL' },
  { id: '6', first_name: 'Jennifer', last_name: 'Davis', title: 'Marketing Manager', company: 'Heartland Dental', email: 'jdavis@heartland.com', has_email: true, location: 'Effingham, IL' },
  { id: '7', first_name: 'Michael', last_name: 'Brown', title: 'VP Marketing', company: 'Dental Care Alliance', email: null, has_email: false, location: 'Sarasota, FL' },
  { id: '8', first_name: 'Lisa', last_name: 'Anderson', title: 'Chief Marketing Officer', company: 'Affordable Dentures', email: 'landerson@affordabledentures.com', has_email: true, location: 'Kinston, NC' },
];

export default function ApolloLeads() {
  const [leads] = useState<Lead[]>(sampleLeads);
  const [searchQuery, setSearchQuery] = useState('');
  const [industry, setIndustry] = useState('dental');
  const [titles, setTitles] = useState('CMO,Marketing Director,VP Marketing');
  const [location, setLocation] = useState('United States');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    setIsSearching(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSearching(false);
    // In production, this would call the Apollo API
  };

  const toggleSelectLead = (id: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLeads(newSelected);
  };

  const selectAll = () => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads.map(l => l.id)));
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lead.first_name.toLowerCase().includes(query) ||
      lead.last_name.toLowerCase().includes(query) ||
      lead.company.toLowerCase().includes(query) ||
      lead.title.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Target className="w-8 h-8 text-orange-500" />
              Apollo.io Lead Generation
            </h1>
            <p className="text-gray-400 mt-1">Find healthcare & dental marketing leaders</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {}}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => {}}
              disabled={selectedLeads.size === 0}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Import {selectedLeads.size > 0 ? `(${selectedLeads.size})` : ''} to Contacts
            </button>
          </div>
        </div>

        {/* Search Filters */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 mb-6 border border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-white">Search Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-orange-500 focus:outline-none"
              >
                <option value="dental">Dental</option>
                <option value="healthcare">Healthcare</option>
                <option value="medical">Medical Practice</option>
                <option value="hospital">Hospital & Health Care</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Job Titles</label>
              <input
                type="text"
                value={titles}
                onChange={(e) => setTitles(e.target.value)}
                placeholder="CMO, Marketing Director..."
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-orange-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="United States"
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-orange-500 focus:outline-none"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-500 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSearching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Search Apollo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter results by name, company, or title..."
              className="w-full pl-10 pr-4 py-3 bg-slate-800/50 text-white rounded-xl border border-slate-700 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Results Stats */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-400">
            Showing <span className="text-white font-semibold">{filteredLeads.length}</span> leads
            {selectedLeads.size > 0 && (
              <span className="ml-2 text-orange-400">({selectedLeads.size} selected)</span>
            )}
          </p>
          <button
            onClick={selectAll}
            className="text-sm text-orange-400 hover:text-orange-300"
          >
            {selectedLeads.size === leads.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {/* Leads Table */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedLeads.size === leads.length && leads.length > 0}
                    onChange={selectAll}
                    className="rounded border-slate-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Title</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Company</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Location</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredLeads.map((lead) => (
                <tr 
                  key={lead.id} 
                  className={`hover:bg-slate-700/30 transition-colors ${selectedLeads.has(lead.id) ? 'bg-orange-900/20' : ''}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedLeads.has(lead.id)}
                      onChange={() => toggleSelectLead(lead.id)}
                      className="rounded border-slate-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                        {lead.first_name[0]}{lead.last_name[0]}
                      </div>
                      <span className="text-white font-medium">{lead.first_name} {lead.last_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{lead.title}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      {lead.company}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{lead.location || '-'}</td>
                  <td className="px-4 py-3">
                    {lead.has_email ? (
                      <span className="inline-flex items-center gap-1 text-green-400">
                        <Mail className="w-4 h-4" />
                        Available
                      </span>
                    ) : (
                      <span className="text-gray-500">Not available</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-orange-400 hover:text-orange-300 text-sm">
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CLI Command Hint */}
        <div className="mt-6 bg-slate-800/30 rounded-xl p-4 border border-slate-700">
          <p className="text-gray-400 text-sm">
            💡 <span className="text-white">Pro tip:</span> Use the CLI for bulk searches:
          </p>
          <code className="block mt-2 text-orange-400 font-mono text-sm bg-slate-900/50 p-3 rounded-lg">
            clawbot apollo healthcare --limit 50 --import
          </code>
        </div>
      </div>
    </div>
  );
}
