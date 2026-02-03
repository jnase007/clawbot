import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useClient } from '@/components/ClientProvider';
import { 
  Workflow,
  Plus,
  Play,
  Pause,
  Trash2,
  Clock,
  Mail,
  MessageSquare,
  ArrowDown,
  Building2,
  CheckCircle,
  GripVertical,
  Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Template } from '@/lib/types';

interface SequenceStep {
  id: string;
  order: number;
  type: 'email' | 'linkedin' | 'wait' | 'condition';
  delay_days: number;
  delay_hours: number;
  template_id?: string;
  template_name?: string;
  subject?: string;
  content?: string;
  condition?: string;
}

interface Sequence {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused';
  steps: SequenceStep[];
  enrolled_count: number;
  completed_count: number;
  created_at: string;
}

// Step type options
const stepTypes = [
  { value: 'email', label: 'Send Email', icon: Mail, color: 'text-blue-500' },
  { value: 'linkedin', label: 'LinkedIn Message', icon: MessageSquare, color: 'text-sky-500' },
  { value: 'wait', label: 'Wait / Delay', icon: Clock, color: 'text-yellow-500' },
];

// Delay presets
const delayPresets = [
  { label: '1 day', days: 1, hours: 0 },
  { label: '2 days', days: 2, hours: 0 },
  { label: '3 days', days: 3, hours: 0 },
  { label: '1 week', days: 7, hours: 0 },
];

export default function Sequences() {
  const { currentClientId, currentClient } = useClient();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingSequence, setEditingSequence] = useState<Sequence | null>(null);

  // Builder state
  const [sequenceName, setSequenceName] = useState('');
  const [sequenceDesc, setSequenceDesc] = useState('');
  const [steps, setSteps] = useState<SequenceStep[]>([]);

  useEffect(() => {
    if (currentClientId) {
      fetchData();
    }
  }, [currentClientId]);

  async function fetchData() {
    if (!currentClientId) return;
    try {
      // Fetch templates for this client
      const { data: templatesData } = await supabase
        .from('templates')
        .select('*')
        .eq('client_id', currentClientId)
        .eq('is_active', true);
      
      setTemplates(templatesData as Template[] || []);

      // For now, use mock sequences (we'll add a sequences table later)
      setSequences([]);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  function addStep(type: 'email' | 'linkedin' | 'wait') {
    const newStep: SequenceStep = {
      id: crypto.randomUUID(),
      order: steps.length + 1,
      type,
      delay_days: type === 'wait' ? 2 : 0,
      delay_hours: 0,
    };
    setSteps([...steps, newStep]);
  }

  function updateStep(id: string, updates: Partial<SequenceStep>) {
    setSteps(steps.map(s => s.id === id ? { ...s, ...updates } : s));
  }

  function removeStep(id: string) {
    setSteps(steps.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i + 1 })));
  }

  function duplicateStep(step: SequenceStep) {
    const newStep = { ...step, id: crypto.randomUUID(), order: steps.length + 1 };
    setSteps([...steps, newStep]);
  }

  async function saveSequence() {
    if (!sequenceName || steps.length === 0) return;
    
    // For now, save to localStorage (we'll add a DB table later)
    const sequence: Sequence = {
      id: editingSequence?.id || crypto.randomUUID(),
      name: sequenceName,
      description: sequenceDesc,
      status: 'draft',
      steps,
      enrolled_count: 0,
      completed_count: 0,
      created_at: new Date().toISOString(),
    };

    const savedSequences = JSON.parse(localStorage.getItem(`sequences-${currentClientId || 'default'}`) || '[]');
    const existingIndex = savedSequences.findIndex((s: Sequence) => s.id === sequence.id);
    
    if (existingIndex >= 0) {
      savedSequences[existingIndex] = sequence;
    } else {
      savedSequences.push(sequence);
    }
    
    localStorage.setItem(`sequences-${currentClientId || 'default'}`, JSON.stringify(savedSequences));
    
    setSequences(savedSequences);
    resetBuilder();
  }

  function loadSequences() {
    const saved = JSON.parse(localStorage.getItem(`sequences-${currentClientId || 'default'}`) || '[]');
    setSequences(saved);
  }

  useEffect(() => {
    if (currentClientId) {
      loadSequences();
    }
  }, [currentClientId]);

  function resetBuilder() {
    setShowBuilder(false);
    setEditingSequence(null);
    setSequenceName('');
    setSequenceDesc('');
    setSteps([]);
  }

  function editSequence(sequence: Sequence) {
    setEditingSequence(sequence);
    setSequenceName(sequence.name);
    setSequenceDesc(sequence.description || '');
    setSteps(sequence.steps);
    setShowBuilder(true);
  }

  function deleteSequence(id: string) {
    const saved = JSON.parse(localStorage.getItem(`sequences-${currentClientId || 'default'}`) || '[]');
    const updated = saved.filter((s: Sequence) => s.id !== id);
    localStorage.setItem(`sequences-${currentClientId || 'default'}`, JSON.stringify(updated));
    setSequences(updated);
  }

  function toggleSequenceStatus(sequence: Sequence) {
    const newStatus = sequence.status === 'active' ? 'paused' : 'active';
    const saved = JSON.parse(localStorage.getItem(`sequences-${currentClientId || 'default'}`) || '[]');
    const updated = saved.map((s: Sequence) => 
      s.id === sequence.id ? { ...s, status: newStatus } : s
    );
    localStorage.setItem(`sequences-${currentClientId || 'default'}`, JSON.stringify(updated));
    setSequences(updated);
  }

  // No client selected
  if (!currentClientId || !currentClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Building2 className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold mb-2">Select a Client</h2>
        <p className="text-muted-foreground max-w-md">
          Choose a client from the dropdown above to manage their sequences.
        </p>
      </div>
    );
  }

  // Sequence Builder View
  if (showBuilder) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">
              {editingSequence ? 'Edit Sequence' : 'Create Sequence'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Build multi-step automated outreach campaigns
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={resetBuilder}>
              Cancel
            </Button>
            <Button 
              onClick={saveSequence} 
              disabled={!sequenceName || steps.length === 0}
              className="btn-gradient"
            >
              Save Sequence
            </Button>
          </div>
        </div>

        {/* Sequence Info */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Sequence Name</label>
              <Input
                value={sequenceName}
                onChange={(e) => setSequenceName(e.target.value)}
                placeholder="e.g., New Lead Nurture Sequence"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description (optional)</label>
              <Input
                value={sequenceDesc}
                onChange={(e) => setSequenceDesc(e.target.value)}
                placeholder="e.g., 5-touch sequence for cold leads"
              />
            </div>
          </CardContent>
        </Card>

        {/* Steps Builder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="w-5 h-5 text-primary" />
              Sequence Steps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Step Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Add step:</span>
              {stepTypes.map((type) => (
                <Button
                  key={type.value}
                  variant="outline"
                  size="sm"
                  onClick={() => addStep(type.value as 'email' | 'linkedin' | 'wait')}
                  className="gap-2"
                >
                  <type.icon className={cn("w-4 h-4", type.color)} />
                  {type.label}
                </Button>
              ))}
            </div>

            {/* Steps List */}
            {steps.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                <Workflow className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No steps yet</p>
                <p className="text-sm text-muted-foreground">Click the buttons above to add steps</p>
              </div>
            ) : (
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={step.id}>
                    {/* Step Card */}
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30 border border-border">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        {step.type === 'wait' ? (
                          // Wait step
                          <div className="flex items-center gap-4">
                            <Clock className="w-5 h-5 text-yellow-500" />
                            <span className="text-sm font-medium">Wait for</span>
                            <div className="flex items-center gap-2">
                              {delayPresets.map((preset) => (
                                <Button
                                  key={preset.label}
                                  variant={step.delay_days === preset.days ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => updateStep(step.id, { delay_days: preset.days })}
                                >
                                  {preset.label}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          // Email/LinkedIn step
                          <>
                            <div className="flex items-center gap-2">
                              {step.type === 'email' ? (
                                <Mail className="w-5 h-5 text-blue-500" />
                              ) : (
                                <MessageSquare className="w-5 h-5 text-sky-500" />
                              )}
                              <span className="text-sm font-medium capitalize">
                                {step.type === 'email' ? 'Send Email' : 'LinkedIn Message'}
                              </span>
                            </div>
                            
                            {/* Template Selector */}
                            <select
                              value={step.template_id || ''}
                              onChange={(e) => {
                                const template = templates.find(t => t.id === e.target.value);
                                updateStep(step.id, {
                                  template_id: e.target.value,
                                  template_name: template?.name,
                                  subject: template?.subject ?? undefined,
                                  content: template?.content,
                                });
                              }}
                              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                            >
                              <option value="">Select a template...</option>
                              {templates
                                .filter(t => t.platform === step.type || (step.type === 'email' && t.type === 'email'))
                                .map((t) => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>

                            {step.template_name && (
                              <div className="p-3 rounded-lg bg-background border border-border">
                                <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                                {step.subject && (
                                  <p className="text-sm font-medium mb-1">Subject: {step.subject}</p>
                                )}
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {step.content}
                                </p>
                              </div>
                            )}

                            {/* Delay before this step */}
                            {index > 0 && (
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Send after</span>
                                <select
                                  value={step.delay_days}
                                  onChange={(e) => updateStep(step.id, { delay_days: parseInt(e.target.value) })}
                                  className="px-2 py-1 rounded border border-border bg-background text-sm"
                                >
                                  <option value={0}>Immediately</option>
                                  <option value={1}>1 day</option>
                                  <option value={2}>2 days</option>
                                  <option value={3}>3 days</option>
                                  <option value={5}>5 days</option>
                                  <option value={7}>1 week</option>
                                </select>
                                <span className="text-muted-foreground">from previous step</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => duplicateStep(step)}
                          className="h-8 w-8"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStep(step.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Connector Arrow */}
                    {index < steps.length - 1 && (
                      <div className="flex justify-center py-2">
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Sequences List View
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Workflow className="w-8 h-8 text-primary" />
            Sequences
          </h1>
          <p className="text-muted-foreground mt-1">
            Multi-step automated outreach campaigns
          </p>
        </div>
        <Button onClick={() => setShowBuilder(true)} className="btn-gradient gap-2">
          <Plus className="w-4 h-4" />
          Create Sequence
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Sequences</p>
                <p className="text-3xl font-display font-bold text-green-500">
                  {sequences.filter(s => s.status === 'active').length}
                </p>
              </div>
              <Play className="w-8 h-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Enrolled</p>
                <p className="text-3xl font-display font-bold text-primary">
                  {sequences.reduce((acc, s) => acc + s.enrolled_count, 0)}
                </p>
              </div>
              <Mail className="w-8 h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-display font-bold text-accent">
                  {sequences.reduce((acc, s) => acc + s.completed_count, 0)}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-accent/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sequences List */}
      {sequences.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Workflow className="w-16 h-16 mx-auto mb-4 text-primary/30" />
            <h3 className="text-xl font-display font-bold mb-2">No Sequences Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Create multi-step campaigns that automatically follow up with leads 
              over days or weeks.
            </p>
            <Button onClick={() => setShowBuilder(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Sequence
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sequences.map((sequence) => (
            <Card 
              key={sequence.id} 
              className={cn(
                "card-hover",
                sequence.status === 'active' && "border-green-500/30"
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  {/* Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    sequence.status === 'active' ? "bg-green-500/10" : "bg-secondary"
                  )}>
                    <Workflow className={cn(
                      "w-6 h-6",
                      sequence.status === 'active' ? "text-green-500" : "text-muted-foreground"
                    )} />
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-display font-bold text-lg">{sequence.name}</h3>
                      <Badge 
                        variant={
                          sequence.status === 'active' ? 'success' : 
                          sequence.status === 'paused' ? 'warning' : 'secondary'
                        }
                      >
                        {sequence.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {sequence.steps.length} steps · {sequence.description || 'No description'}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-8 text-center">
                    <div>
                      <p className="text-2xl font-bold">{sequence.enrolled_count}</p>
                      <p className="text-xs text-muted-foreground">Enrolled</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-500">{sequence.completed_count}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSequenceStatus(sequence)}
                    >
                      {sequence.status === 'active' ? (
                        <><Pause className="w-3 h-3 mr-1" /> Pause</>
                      ) : (
                        <><Play className="w-3 h-3 mr-1" /> Start</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editSequence(sequence)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSequence(sequence.id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Steps Preview */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 flex-wrap">
                    {sequence.steps.map((step, i) => (
                      <div key={step.id} className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary text-xs">
                          {step.type === 'email' && <Mail className="w-3 h-3 text-blue-500" />}
                          {step.type === 'linkedin' && <MessageSquare className="w-3 h-3 text-sky-500" />}
                          {step.type === 'wait' && <Clock className="w-3 h-3 text-yellow-500" />}
                          <span>
                            {step.type === 'wait' 
                              ? `Wait ${step.delay_days}d`
                              : (step.template_name ?? step.type)
                            }
                          </span>
                        </div>
                        {i < sequence.steps.length - 1 && (
                          <ArrowDown className="w-3 h-3 text-muted-foreground rotate-[-90deg]" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
