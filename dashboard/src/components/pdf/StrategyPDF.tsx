import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';

// Brandastic brand colors
const COLORS = {
  primary: '#06b6d4', // Cyan
  secondary: '#8b5cf6', // Purple  
  accent: '#f97316', // Orange
  success: '#22c55e', // Green
  dark: '#0f172a',
  gray: '#64748b',
  lightGray: '#f1f5f9',
  white: '#ffffff',
};

const styles = StyleSheet.create({
  // Cover Page
  coverPage: {
    backgroundColor: COLORS.dark,
    padding: 0,
    position: 'relative',
  },
  coverContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },
  coverLogo: {
    width: 100,
    height: 100,
    marginBottom: 40,
    borderRadius: 16,
  },
  coverLetterLogo: {
    width: 100,
    height: 100,
    marginBottom: 40,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverLogoText: {
    color: COLORS.white,
    fontSize: 50,
    fontWeight: 700,
  },
  coverSubtitle: {
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  coverTitle: {
    fontSize: 36,
    fontWeight: 700,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  coverClient: {
    fontSize: 20,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 40,
  },
  coverDate: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
  coverFooter: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  coverBrandastic: {
    fontSize: 11,
    color: COLORS.gray,
    letterSpacing: 2,
  },
  coverDivider: {
    width: 60,
    height: 3,
    backgroundColor: COLORS.primary,
    marginVertical: 20,
  },

  // Content Pages
  page: {
    padding: 50,
    fontSize: 10,
    color: COLORS.dark,
    backgroundColor: COLORS.white,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 25,
    paddingBottom: 12,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: COLORS.dark,
  },
  pageSubtitle: {
    fontSize: 10,
    color: COLORS.gray,
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.primary,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Executive Summary Box
  summaryBox: {
    backgroundColor: '#ecfeff',
    padding: 18,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  summaryText: {
    fontSize: 11,
    lineHeight: 1.7,
    color: COLORS.dark,
  },

  // Two/Three Column Layout
  twoColumn: {
    flexDirection: 'row',
    gap: 15,
  },
  threeColumn: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
  },

  // Cards
  card: {
    backgroundColor: COLORS.lightGray,
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: COLORS.dark,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 9,
    color: COLORS.gray,
  },
  cardContent: {
    fontSize: 10,
    color: COLORS.dark,
    marginTop: 6,
    lineHeight: 1.4,
  },

  // Channel Cards (colored borders)
  channelCard: {
    backgroundColor: COLORS.lightGray,
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  channelCardEmail: { borderLeftColor: '#3b82f6' },
  channelCardLinkedIn: { borderLeftColor: '#0077b5' },
  channelCardContent: { borderLeftColor: '#10b981' },
  channelCardSEO: { borderLeftColor: '#f59e0b' },
  channelCardAds: { borderLeftColor: '#ef4444' },
  channelCardSocial: { borderLeftColor: '#8b5cf6' },

  // KPI Table
  kpiRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  kpiMetric: {
    flex: 2,
    fontSize: 10,
    fontWeight: 500,
    color: COLORS.dark,
  },
  kpiTarget: {
    flex: 1,
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: 600,
    textAlign: 'right',
  },

  // Timeline Phases
  phaseContainer: {
    marginBottom: 15,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  phaseNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  phaseNumberText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 700,
  },
  phaseName: {
    fontSize: 12,
    fontWeight: 600,
    color: COLORS.dark,
  },
  phaseDuration: {
    fontSize: 9,
    color: COLORS.gray,
    marginLeft: 8,
  },
  phaseFocus: {
    fontSize: 10,
    color: COLORS.gray,
    fontStyle: 'italic',
    marginLeft: 38,
    marginBottom: 6,
  },
  phaseMilestones: {
    marginLeft: 38,
  },
  milestoneItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  milestoneCheck: {
    fontSize: 10,
    color: COLORS.success,
    marginRight: 6,
  },
  milestoneText: {
    fontSize: 9,
    color: COLORS.dark,
  },

  // Lists
  listItem: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  bullet: {
    width: 15,
    fontSize: 10,
    color: COLORS.primary,
  },
  listText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.4,
    color: COLORS.dark,
  },

  // Next Steps
  stepCard: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
    alignItems: 'center',
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepNumberText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 700,
  },
  stepText: {
    flex: 1,
    fontSize: 10,
    color: '#166534',
  },

  // Risks
  riskCard: {
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  riskTitle: {
    fontSize: 10,
    fontWeight: 600,
    color: '#dc2626',
    marginBottom: 4,
  },
  riskMitigation: {
    fontSize: 9,
    color: COLORS.dark,
  },

  // Persona Card
  personaCard: {
    backgroundColor: COLORS.lightGray,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  personaTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: COLORS.dark,
    marginBottom: 4,
  },
  personaIndustry: {
    fontSize: 10,
    color: COLORS.primary,
    marginBottom: 10,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  footerText: {
    fontSize: 8,
    color: COLORS.gray,
  },
  pageNumber: {
    fontSize: 9,
    color: COLORS.gray,
    fontWeight: 600,
  },
});

interface StrategyPDFProps {
  strategy: {
    executiveSummary?: string;
    goals?: Array<{ goal: string; metric: string; target: string; timeline: string }>;
    targetPersona?: {
      title?: string;
      industry?: string;
      painPoints?: string[];
      motivations?: string[];
      objections?: string[];
    };
    channelStrategy?: Array<{
      channel: string;
      priority: string;
      tactics: string[];
      frequency: string;
      budget?: string;
    }>;
    contentCalendar?: Array<{
      week: number;
      theme?: string;
      content: string | string[];
      channel?: string;
      goal?: string;
    }>;
    kpis?: Array<{ metric: string; target: string; tracking?: string; importance?: string }>;
    timeline?: {
      phase1?: { name: string; duration: string; focus: string; milestones: string[] };
      phase2?: { name: string; duration: string; focus: string; milestones: string[] };
      phase3?: { name: string; duration: string; focus: string; milestones: string[] };
    };
    risks?: Array<{ risk: string; mitigation: string }>;
    nextSteps?: string[];
    templates?: Array<{ name: string; type: string; subject?: string; content: string }>;
  };
  clientName: string;
  clientLogo?: string;
}

function getChannelStyle(channel: string) {
  const lc = channel.toLowerCase();
  if (lc.includes('email')) return styles.channelCardEmail;
  if (lc.includes('linkedin')) return styles.channelCardLinkedIn;
  if (lc.includes('content') || lc.includes('blog')) return styles.channelCardContent;
  if (lc.includes('seo')) return styles.channelCardSEO;
  if (lc.includes('ads') || lc.includes('ppc')) return styles.channelCardAds;
  return styles.channelCardSocial;
}

export function StrategyPDF({ strategy, clientName, clientLogo }: StrategyPDFProps) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverContent}>
          {clientLogo ? (
            <Image src={clientLogo} style={styles.coverLogo} />
          ) : (
            <View style={styles.coverLetterLogo}>
              <Text style={styles.coverLogoText}>{clientName?.charAt(0) || 'C'}</Text>
            </View>
          )}
          <View style={styles.coverDivider} />
          <Text style={styles.coverSubtitle}>Marketing Strategy</Text>
          <Text style={styles.coverTitle}>90-Day Growth Plan</Text>
          <Text style={styles.coverClient}>{clientName}</Text>
          <Text style={styles.coverDate}>{today}</Text>
        </View>
        <View style={styles.coverFooter}>
          <Text style={styles.coverBrandastic}>POWERED BY BRANDASTIC</Text>
        </View>
      </Page>

      {/* Page 1: Executive Summary & Goals */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>Executive Summary</Text>
            <Text style={styles.pageSubtitle}>{clientName} • 90-Day Strategy</Text>
          </View>
        </View>

        {strategy.executiveSummary && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>{strategy.executiveSummary}</Text>
          </View>
        )}

        {strategy.goals && strategy.goals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Strategic Goals</Text>
            {strategy.goals.map((goal, idx) => (
              <View key={idx} style={styles.kpiRow}>
                <Text style={styles.kpiMetric}>{goal.goal || goal.metric}</Text>
                <Text style={styles.kpiTarget}>{goal.target}</Text>
              </View>
            ))}
          </View>
        )}

        {strategy.targetPersona && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Target Persona</Text>
            <View style={styles.personaCard}>
              <Text style={styles.personaTitle}>{strategy.targetPersona.title || 'Decision Maker'}</Text>
              <Text style={styles.personaIndustry}>{strategy.targetPersona.industry || 'Target Industry'}</Text>
              
              {strategy.targetPersona.painPoints && strategy.targetPersona.painPoints.length > 0 && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 9, fontWeight: 600, color: COLORS.gray, marginBottom: 4 }}>PAIN POINTS:</Text>
                  {strategy.targetPersona.painPoints.slice(0, 3).map((point, idx) => (
                    <View key={idx} style={styles.listItem}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.listText}>{point}</Text>
                    </View>
                  ))}
                </View>
              )}
              
              {strategy.targetPersona.motivations && strategy.targetPersona.motivations.length > 0 && (
                <View>
                  <Text style={{ fontSize: 9, fontWeight: 600, color: COLORS.gray, marginBottom: 4 }}>MOTIVATIONS:</Text>
                  {strategy.targetPersona.motivations.slice(0, 3).map((motivation, idx) => (
                    <View key={idx} style={styles.listItem}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.listText}>{motivation}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Confidential • Brandastic Marketing Strategy</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>

      {/* Page 2: Channel Strategy & KPIs */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>Channel Strategy</Text>
            <Text style={styles.pageSubtitle}>{clientName}</Text>
          </View>
        </View>

        {strategy.channelStrategy && strategy.channelStrategy.length > 0 && (
          <View style={styles.section}>
            <View style={styles.twoColumn}>
              <View style={styles.column}>
                {strategy.channelStrategy.slice(0, Math.ceil(strategy.channelStrategy.length / 2)).map((channel, idx) => (
                  <View key={idx} style={[styles.channelCard, getChannelStyle(channel.channel)]}>
                    <Text style={styles.cardTitle}>{channel.channel}</Text>
                    <Text style={styles.cardSubtitle}>Priority: {channel.priority} • {channel.frequency}</Text>
                    {channel.tactics && channel.tactics.slice(0, 2).map((tactic, tidx) => (
                      <View key={tidx} style={[styles.listItem, { marginTop: 4 }]}>
                        <Text style={styles.bullet}>→</Text>
                        <Text style={styles.listText}>{tactic}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
              <View style={styles.column}>
                {strategy.channelStrategy.slice(Math.ceil(strategy.channelStrategy.length / 2)).map((channel, idx) => (
                  <View key={idx} style={[styles.channelCard, getChannelStyle(channel.channel)]}>
                    <Text style={styles.cardTitle}>{channel.channel}</Text>
                    <Text style={styles.cardSubtitle}>Priority: {channel.priority} • {channel.frequency}</Text>
                    {channel.tactics && channel.tactics.slice(0, 2).map((tactic, tidx) => (
                      <View key={tidx} style={[styles.listItem, { marginTop: 4 }]}>
                        <Text style={styles.bullet}>→</Text>
                        <Text style={styles.listText}>{tactic}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {strategy.kpis && strategy.kpis.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
            {strategy.kpis.map((kpi, idx) => (
              <View key={idx} style={styles.kpiRow}>
                <Text style={styles.kpiMetric}>{kpi.metric}</Text>
                <Text style={styles.kpiTarget}>{kpi.target}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Confidential • Brandastic Marketing Strategy</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>

      {/* Page 3: Timeline & Next Steps */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>Implementation Timeline</Text>
            <Text style={styles.pageSubtitle}>{clientName} • 90-Day Roadmap</Text>
          </View>
        </View>

        {strategy.timeline && (
          <View style={styles.section}>
            {['phase1', 'phase2', 'phase3'].map((phaseKey, i) => {
              const phase = strategy.timeline?.[phaseKey as keyof typeof strategy.timeline];
              if (!phase) return null;
              return (
                <View key={phaseKey} style={styles.phaseContainer}>
                  <View style={styles.phaseHeader}>
                    <View style={styles.phaseNumber}>
                      <Text style={styles.phaseNumberText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.phaseName}>{phase.name}</Text>
                    <Text style={styles.phaseDuration}>{phase.duration}</Text>
                  </View>
                  <Text style={styles.phaseFocus}>{phase.focus}</Text>
                  <View style={styles.phaseMilestones}>
                    {phase.milestones?.slice(0, 4).map((milestone, j) => (
                      <View key={j} style={styles.milestoneItem}>
                        <Text style={styles.milestoneCheck}>✓</Text>
                        <Text style={styles.milestoneText}>{milestone}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {strategy.nextSteps && strategy.nextSteps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Immediate Next Steps</Text>
            {strategy.nextSteps.slice(0, 5).map((step, idx) => (
              <View key={idx} style={styles.stepCard}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{idx + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        )}

        {strategy.risks && strategy.risks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Risk Mitigation</Text>
            {strategy.risks.slice(0, 3).map((risk, idx) => (
              <View key={idx} style={styles.riskCard}>
                <Text style={styles.riskTitle}>⚠ {risk.risk}</Text>
                <Text style={styles.riskMitigation}>→ {risk.mitigation}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Confidential • Brandastic Marketing Strategy</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
