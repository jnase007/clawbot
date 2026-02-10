import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AiDemoWidget } from '@/components/AiDemoWidget';
import { RoiCalculator } from '@/components/RoiCalculator';
import { 
  Rocket, 
  Brain, 
  Mail, 
  Target,
  Workflow,
  Inbox,
  BarChart3,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Zap,
  Shield,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlatformIcon } from '@/components/PlatformIcon';

const features = [
  {
    icon: Brain,
    title: 'AI Strategy Generator',
    description: 'Auto-generate marketing goals and personalized templates based on client industry and audience.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: Workflow,
    title: 'Drip Sequences',
    description: 'Build multi-step automated campaigns with emails, LinkedIn messages, and timed delays.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Inbox,
    title: 'Unified Inbox',
    description: 'All replies from every channel in one place. AI-powered sentiment detection and suggested responses.',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: Target,
    title: 'Multi-Client Dashboard',
    description: 'Manage unlimited clients from one dashboard. Each with isolated data, goals, and campaigns.',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    icon: Mail,
    title: 'Multi-Channel Outreach',
    description: 'Reach prospects via Email, LinkedIn, Reddit, and Twitter from a single platform.',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reporting',
    description: 'Track open rates, response rates, and conversion funnels. Export reports for clients.',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
  },
];

const stats = [
  { value: '10x', label: 'Faster Outreach' },
  { value: '90%', label: 'Time Saved' },
  { value: '∞', label: 'Clients Supported' },
  { value: '24/7', label: 'Automation' },
];

const channels = [
  { platform: 'email', name: 'Email', status: 'Ready' },
  { platform: 'linkedin', name: 'LinkedIn', status: 'Ready' },
  { platform: 'reddit', name: 'Reddit', status: 'Ready' },
  { platform: 'twitter', name: 'Twitter/X', status: 'Ready' },
  { platform: 'github', name: 'GitHub', status: 'Coming Soon' },
  { platform: 'discord', name: 'Discord', status: 'Coming Soon' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" showText={true} />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/dashboard">
              <Button className="btn-gradient gap-2">
                <Rocket className="w-4 h-4" />
                Open Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with Background Image */}
      <section 
        className="relative pt-32 pb-24 px-6 min-h-[90vh] flex items-center"
        style={{
          backgroundImage: `url('https://ndrhfhdsmjrixxbarymj.supabase.co/storage/v1/object/public/Image/C_DSC03021_Edited%20(5).jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Dark Gradient Overlay for Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-background" />
        
        {/* Additional radial gradient for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
        
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Agency Outreach Engine</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight mb-6 animate-slide-up text-white drop-shadow-lg">
            Automate Your Agency's
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500"> Outreach</span>
          </h1>
          
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-10 animate-slide-up stagger-1 drop-shadow-md">
            ClawBot is your AI-powered marketing automation platform. 
            Generate strategies, launch multi-channel campaigns, and manage 
            unlimited clients—all from one intelligent dashboard.
          </p>
          
          <div className="flex items-center justify-center gap-4 animate-slide-up stagger-2">
            <Link to="/dashboard">
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white gap-2 text-lg px-8 shadow-lg shadow-cyan-500/25">
                <Rocket className="w-5 h-5" />
                Get Started
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="gap-2 text-lg px-8 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm">
                Learn More
                <ArrowRight className="w-5 h-5" />
              </Button>
            </a>
          </div>
        </div>
        
        {/* Bottom fade to blend with next section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 border-y border-border bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={stat.label} className={cn("text-center animate-slide-up", `stagger-${i + 1}`)}>
                <p className="text-4xl md:text-5xl font-display font-bold text-primary mb-2">
                  {stat.value}
                </p>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Everything You Need to Scale Outreach
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built for agencies who want to automate client acquisition 
              without sacrificing personalization or quality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card 
                key={feature.title} 
                className={cn(
                  "card-hover animate-slide-up border-2 border-transparent hover:border-primary/20",
                  `stagger-${(i % 3) + 1}`
                )}
              >
                <CardContent className="p-6">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", feature.bgColor)}>
                    <feature.icon className={cn("w-6 h-6", feature.color)} />
                  </div>
                  <h3 className="text-xl font-display font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Channels Section */}
      <section className="py-20 px-6 bg-secondary/30 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              One Platform, Every Channel
            </h2>
            <p className="text-muted-foreground">
              Reach your prospects wherever they are
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {channels.map((channel) => (
              <Card key={channel.name} className="text-center card-hover">
                <CardContent className="p-6">
                  <div className="mb-3 flex justify-center"><PlatformIcon platform={channel.platform} size="xl" /></div>
                  <p className="font-medium">{channel.name}</p>
                  <p className={cn(
                    "text-xs mt-1",
                    channel.status === 'Ready' ? "text-green-500" : "text-muted-foreground"
                  )}>
                    {channel.status}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Try It Live</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Experience AI Marketing in Action
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              See how our AI agents create personalized content for any platform. 
              Generate a sample post right now—no signup required.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AiDemoWidget />
            <RoiCalculator />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground">
              From onboarding to outreach in minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Add Client', desc: 'Enter client details, industry, and goals' },
              { step: '2', title: 'Generate Strategy', desc: 'AI creates tailored templates and KPIs' },
              { step: '3', title: 'Import Contacts', desc: 'Add prospects via CSV or manual entry' },
              { step: '4', title: 'Launch & Monitor', desc: 'Automated outreach with real-time tracking' },
            ].map((item, i) => (
              <div key={item.step} className={cn("text-center animate-slide-up", `stagger-${i + 1}`)}>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-display font-bold text-primary mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary/5 to-accent/5 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                Built for Agencies That Want to Scale
              </h2>
              <div className="space-y-4">
                {[
                  'Manage unlimited clients from one dashboard',
                  'AI generates personalized content at scale',
                  'Multi-channel campaigns that actually convert',
                  'Real-time analytics and client reporting',
                  'No coding required—just strategy and launch',
                ].map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="card-hover">
                <CardContent className="p-6 text-center">
                  <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
                  <p className="font-bold">Fast Setup</p>
                  <p className="text-sm text-muted-foreground">5 min onboarding</p>
                </CardContent>
              </Card>
              <Card className="card-hover">
                <CardContent className="p-6 text-center">
                  <Shield className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                  <p className="font-bold">Secure</p>
                  <p className="text-sm text-muted-foreground">Data isolated per client</p>
                </CardContent>
              </Card>
              <Card className="card-hover">
                <CardContent className="p-6 text-center">
                  <Globe className="w-8 h-8 text-green-500 mx-auto mb-3" />
                  <p className="font-bold">Multi-Channel</p>
                  <p className="text-sm text-muted-foreground">Email, LinkedIn, more</p>
                </CardContent>
              </Card>
              <Card className="card-hover">
                <CardContent className="p-6 text-center">
                  <Users className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                  <p className="font-bold">Team Ready</p>
                  <p className="text-sm text-muted-foreground">Collaborate easily</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Ready to 10x Your Agency's Outreach?
          </h2>
          <p className="text-muted-foreground mb-8">
            Start automating your client acquisition today. No credit card required.
          </p>
          <Link to="/dashboard">
            <Button size="lg" className="btn-gradient gap-2 text-lg px-12">
              <Rocket className="w-5 h-5" />
              Launch Dashboard
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size="sm" showText={true} />
            <span className="text-muted-foreground text-sm">· Agency Outreach Engine</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ClawBot. Built for agencies.
          </p>
        </div>
      </footer>
    </div>
  );
}
