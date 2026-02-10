import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';

// Register fonts for better typography
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff2', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#06b6d4',
  },
  logo: {
    width: 60,
    height: 60,
    objectFit: 'contain',
  },
  headerText: {
    textAlign: 'right',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#06b6d4',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  date: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sectionContent: {
    fontSize: 11,
    lineHeight: 1.6,
    color: '#334155',
  },
  summaryBox: {
    backgroundColor: '#f0fdfa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#06b6d4',
  },
  summaryText: {
    fontSize: 11,
    lineHeight: 1.7,
    color: '#0f766e',
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 20,
  },
  column: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  bullet: {
    width: 15,
    fontSize: 11,
    color: '#06b6d4',
  },
  listText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.5,
    color: '#475569',
  },
  channelCard: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  channelName: {
    fontSize: 12,
    fontWeight: 600,
    color: '#0f172a',
    marginBottom: 4,
  },
  channelDetail: {
    fontSize: 9,
    color: '#64748b',
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  kpiMetric: {
    fontSize: 10,
    fontWeight: 600,
    color: '#334155',
  },
  kpiTarget: {
    fontSize: 10,
    color: '#06b6d4',
    fontWeight: 600,
  },
  timelinePhase: {
    marginBottom: 15,
    paddingLeft: 15,
    borderLeftWidth: 2,
    borderLeftColor: '#06b6d4',
  },
  phaseName: {
    fontSize: 11,
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: 3,
  },
  phaseDuration: {
    fontSize: 9,
    color: '#06b6d4',
    marginBottom: 6,
  },
  phaseFocus: {
    fontSize: 10,
    color: '#475569',
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  },
  pageNumber: {
    fontSize: 8,
    color: '#94a3b8',
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

export function StrategyPDF({ strategy, clientName, clientLogo }: StrategyPDFProps) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document>
      {/* Page 1: Executive Summary & Goals */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {clientLogo ? (
            <Image src={clientLogo} style={styles.logo} />
          ) : (
            <View style={[styles.logo, { backgroundColor: '#06b6d4', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: 'white', fontSize: 24, fontWeight: 700 }}>{clientName?.charAt(0) || 'C'}</Text>
            </View>
          )}
          <View style={styles.headerText}>
            <Text style={styles.title}>Marketing Strategy</Text>
            <Text style={styles.subtitle}>{clientName}</Text>
            <Text style={styles.date}>{today}</Text>
          </View>
        </View>

        {/* Executive Summary */}
        {strategy.executiveSummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Executive Summary</Text>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>{strategy.executiveSummary}</Text>
            </View>
          </View>
        )}

        {/* Goals */}
        {strategy.goals && strategy.goals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Strategic Goals</Text>
            {strategy.goals.map((goal, idx) => (
              <View key={idx} style={styles.kpiRow}>
                <Text style={styles.kpiMetric}>{goal.goal || goal.metric}</Text>
                <Text style={styles.kpiTarget}>{goal.target} ({goal.timeline})</Text>
              </View>
            ))}
          </View>
        )}

        {/* Target Persona */}
        {strategy.targetPersona && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Target Persona</Text>
            <View style={styles.channelCard}>
              <Text style={styles.channelName}>
                {strategy.targetPersona.title || 'Decision Maker'} - {strategy.targetPersona.industry || 'Target Industry'}
              </Text>
              
              {strategy.targetPersona.painPoints && strategy.targetPersona.painPoints.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 9, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Pain Points:</Text>
                  {strategy.targetPersona.painPoints.map((point, idx) => (
                    <View key={idx} style={styles.listItem}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.listText}>{point}</Text>
                    </View>
                  ))}
                </View>
              )}
              
              {strategy.targetPersona.motivations && strategy.targetPersona.motivations.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 9, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Motivations:</Text>
                  {strategy.targetPersona.motivations.map((motivation, idx) => (
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
          <Text style={styles.footerText}>Powered by ClawBot AI • Brandastic</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* Page 2: Channel Strategy & KPIs */}
      <Page size="A4" style={styles.page}>
        <View style={[styles.header, { marginBottom: 20 }]}>
          <Text style={[styles.title, { fontSize: 18 }]}>Channel Strategy & KPIs</Text>
          <Text style={styles.subtitle}>{clientName}</Text>
        </View>

        {/* Channel Strategy */}
        {strategy.channelStrategy && strategy.channelStrategy.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Channel Strategy</Text>
            <View style={styles.twoColumn}>
              <View style={styles.column}>
                {strategy.channelStrategy.slice(0, Math.ceil(strategy.channelStrategy.length / 2)).map((channel, idx) => (
                  <View key={idx} style={styles.channelCard}>
                    <Text style={styles.channelName}>{channel.channel}</Text>
                    <Text style={styles.channelDetail}>Priority: {channel.priority} | Frequency: {channel.frequency}</Text>
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
                  <View key={idx} style={styles.channelCard}>
                    <Text style={styles.channelName}>{channel.channel}</Text>
                    <Text style={styles.channelDetail}>Priority: {channel.priority} | Frequency: {channel.frequency}</Text>
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

        {/* KPIs */}
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
          <Text style={styles.footerText}>Powered by ClawBot AI • Brandastic</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* Page 3: Timeline & Next Steps */}
      <Page size="A4" style={styles.page}>
        <View style={[styles.header, { marginBottom: 20 }]}>
          <Text style={[styles.title, { fontSize: 18 }]}>Implementation Timeline</Text>
          <Text style={styles.subtitle}>{clientName}</Text>
        </View>

        {/* Timeline */}
        {strategy.timeline && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>90-Day Roadmap</Text>
            
            {strategy.timeline.phase1 && (
              <View style={styles.timelinePhase}>
                <Text style={styles.phaseName}>{strategy.timeline.phase1.name || 'Phase 1: Foundation'}</Text>
                <Text style={styles.phaseDuration}>{strategy.timeline.phase1.duration || 'Weeks 1-4'}</Text>
                <Text style={styles.phaseFocus}>{strategy.timeline.phase1.focus}</Text>
                {strategy.timeline.phase1.milestones?.map((milestone, idx) => (
                  <View key={idx} style={[styles.listItem, { marginTop: 4 }]}>
                    <Text style={styles.bullet}>✓</Text>
                    <Text style={styles.listText}>{milestone}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {strategy.timeline.phase2 && (
              <View style={styles.timelinePhase}>
                <Text style={styles.phaseName}>{strategy.timeline.phase2.name || 'Phase 2: Growth'}</Text>
                <Text style={styles.phaseDuration}>{strategy.timeline.phase2.duration || 'Weeks 5-8'}</Text>
                <Text style={styles.phaseFocus}>{strategy.timeline.phase2.focus}</Text>
                {strategy.timeline.phase2.milestones?.map((milestone, idx) => (
                  <View key={idx} style={[styles.listItem, { marginTop: 4 }]}>
                    <Text style={styles.bullet}>✓</Text>
                    <Text style={styles.listText}>{milestone}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {strategy.timeline.phase3 && (
              <View style={styles.timelinePhase}>
                <Text style={styles.phaseName}>{strategy.timeline.phase3.name || 'Phase 3: Scale'}</Text>
                <Text style={styles.phaseDuration}>{strategy.timeline.phase3.duration || 'Weeks 9-12'}</Text>
                <Text style={styles.phaseFocus}>{strategy.timeline.phase3.focus}</Text>
                {strategy.timeline.phase3.milestones?.map((milestone, idx) => (
                  <View key={idx} style={[styles.listItem, { marginTop: 4 }]}>
                    <Text style={styles.bullet}>✓</Text>
                    <Text style={styles.listText}>{milestone}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Next Steps */}
        {strategy.nextSteps && strategy.nextSteps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Immediate Next Steps</Text>
            {strategy.nextSteps.map((step, idx) => (
              <View key={idx} style={styles.listItem}>
                <Text style={[styles.bullet, { fontWeight: 700 }]}>{idx + 1}.</Text>
                <Text style={styles.listText}>{step}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Risks */}
        {strategy.risks && strategy.risks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Risk Mitigation</Text>
            {strategy.risks.slice(0, 4).map((risk, idx) => (
              <View key={idx} style={styles.channelCard}>
                <Text style={[styles.channelName, { color: '#dc2626' }]}>⚠ {risk.risk}</Text>
                <Text style={styles.channelDetail}>Mitigation: {risk.mitigation}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Powered by ClawBot AI • Brandastic</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
