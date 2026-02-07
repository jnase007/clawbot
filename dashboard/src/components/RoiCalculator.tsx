import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Calculator, 
  Clock, 
  DollarSign, 
  TrendingUp,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export function RoiCalculator() {
  const [hoursPerWeek, setHoursPerWeek] = useState(15);
  const [hourlyCost, setHourlyCost] = useState(75);
  const [monthlyAdSpend, setMonthlyAdSpend] = useState(5000);
  const [showResults, setShowResults] = useState(false);

  const results = useMemo(() => {
    // Calculate monthly savings
    const monthlyHours = hoursPerWeek * 4;
    const automationRate = 0.7; // AI automates ~70% of repetitive tasks
    const hoursSaved = Math.round(monthlyHours * automationRate);
    const laborSavings = hoursSaved * hourlyCost;
    
    // Calculate ad performance improvement
    const adImprovementRate = 0.2; // ~20% better ad performance with AI optimization
    const adSavings = Math.round(monthlyAdSpend * adImprovementRate);
    
    // Total monthly value
    const totalMonthlySavings = laborSavings + adSavings;
    const annualSavings = totalMonthlySavings * 12;

    return {
      hoursSaved,
      laborSavings,
      adSavings,
      totalMonthlySavings,
      annualSavings,
    };
  }, [hoursPerWeek, hourlyCost, monthlyAdSpend]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="gradient-border overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">ROI Calculator</h3>
              <p className="text-sm text-muted-foreground">See your potential savings with AI automation</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Inputs */}
          <div className="space-y-5">
            {/* Hours per week */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Hours spent on content/outreach per week
                </label>
                <span className="text-lg font-bold text-primary">{hoursPerWeek}h</span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>5h</span>
                <span>40h</span>
              </div>
            </div>

            {/* Hourly cost */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  Hourly cost of that work
                </label>
                <span className="text-lg font-bold text-primary">${hourlyCost}/hr</span>
              </div>
              <input
                type="range"
                min="25"
                max="200"
                step="5"
                value={hourlyCost}
                onChange={(e) => setHourlyCost(Number(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>$25</span>
                <span>$200</span>
              </div>
            </div>

            {/* Monthly ad spend */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  Monthly marketing/ad spend
                </label>
                <span className="text-lg font-bold text-primary">{formatCurrency(monthlyAdSpend)}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="50000"
                step="1000"
                value={monthlyAdSpend}
                onChange={(e) => setMonthlyAdSpend(Number(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>$1K</span>
                <span>$50K</span>
              </div>
            </div>
          </div>

          {/* Calculate Button */}
          <Button
            onClick={() => setShowResults(true)}
            className="w-full btn-gradient gap-2 py-6 text-lg"
          >
            <Sparkles className="w-5 h-5" />
            Calculate My Savings
          </Button>

          {/* Results */}
          {showResults && (
            <div className="animate-fade-in space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 text-blue-500 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium">Time Saved</span>
                  </div>
                  <p className="text-2xl font-display font-bold">{results.hoursSaved}h</p>
                  <p className="text-xs text-muted-foreground">per month</p>
                </div>

                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 text-green-500 mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs font-medium">Labor Savings</span>
                  </div>
                  <p className="text-2xl font-display font-bold">{formatCurrency(results.laborSavings)}</p>
                  <p className="text-xs text-muted-foreground">per month</p>
                </div>

                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-2 text-purple-500 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-medium">Better Ad ROI</span>
                  </div>
                  <p className="text-2xl font-display font-bold">{formatCurrency(results.adSavings)}</p>
                  <p className="text-xs text-muted-foreground">per month</p>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-medium">Total Value</span>
                  </div>
                  <p className="text-2xl font-display font-bold">{formatCurrency(results.totalMonthlySavings)}</p>
                  <p className="text-xs text-muted-foreground">per month</p>
                </div>
              </div>

              {/* Annual projection */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10 text-center">
                <p className="text-sm text-muted-foreground mb-1">Projected Annual Value</p>
                <p className="text-4xl font-display font-bold gradient-text">
                  {formatCurrency(results.annualSavings)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Plus: better engagement, more leads, and faster growth
                </p>
              </div>

              {/* CTA */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary border border-border">
                <div>
                  <p className="font-medium">Ready to capture this value?</p>
                  <p className="text-sm text-muted-foreground">Get a custom ROI analysis for your business</p>
                </div>
                <Button className="btn-gradient gap-2">
                  Get Analysis
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default RoiCalculator;
