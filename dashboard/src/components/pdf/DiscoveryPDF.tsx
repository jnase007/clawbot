import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';

// Register fonts
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
    borderBottomColor: '#8b5cf6',
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
    color: '#8b5cf6',
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
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: 8,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sectionContent: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#334155',
  },
  infoBox: {
    backgroundColor: '#faf5ff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#8b5cf6',
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: 600,
    color: '#7c3aed',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  infoText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#334155',
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 15,
  },
  column: {
    flex: 1,
  },
  tag: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 5,
    marginBottom: 5,
  },
  tagText: {
    fontSize: 9,
    color: '#7c3aed',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bullet: {
    width: 15,
    fontSize: 10,
    color: '#8b5cf6',
  },
  listText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.4,
    color: '#475569',
  },
  competitorCard: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  competitorName: {
    fontSize: 11,
    fontWeight: 600,
    color: '#0f172a',
  },
  goalCard: {
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#22c55e',
  },
  goalText: {
    fontSize: 10,
    color: '#166534',
    fontWeight: 600,
  },
  metricText: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
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
  budgetBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  budgetText: {
    fontSize: 11,
    fontWeight: 600,
    color: '#1d4ed8',
  },
});

interface DiscoveryPDFProps {
  discovery: {
    businessDescription?: string;
    targetAudience?: string;
    uniqueValueProposition?: string;
    currentMarketingChannels?: string[];
    currentMonthlyBudget?: string;
    currentPainPoints?: string[];
    competitors?: string[];
    competitorAnalysis?: string;
    primaryGoals?: string[];
    successMetrics?: string[];
    timeline?: string;
    existingTools?: string[];
    websiteUrl?: string;
    socialProfiles?: string;
    discoveryNotes?: string;
  };
  clientName: string;
  clientLogo?: string;
  clientIndustry?: string;
}

export function DiscoveryPDF({ discovery, clientName, clientLogo, clientIndustry }: DiscoveryPDFProps) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document>
      {/* Page 1: Business Overview & Current State */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {clientLogo ? (
            <Image src={clientLogo} style={styles.logo} />
          ) : (
            <View style={[styles.logo, { backgroundColor: '#8b5cf6', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: 'white', fontSize: 24, fontWeight: 700 }}>{clientName?.charAt(0) || 'C'}</Text>
            </View>
          )}
          <View style={styles.headerText}>
            <Text style={styles.title}>Discovery Document</Text>
            <Text style={styles.subtitle}>{clientName}</Text>
            {clientIndustry && <Text style={styles.date}>{clientIndustry}</Text>}
            <Text style={styles.date}>{today}</Text>
          </View>
        </View>

        {/* Business Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Overview</Text>
          
          {discovery.businessDescription && (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>About the Business</Text>
              <Text style={styles.infoText}>{discovery.businessDescription}</Text>
            </View>
          )}
          
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              {discovery.targetAudience && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Target Audience</Text>
                  <Text style={styles.infoText}>{discovery.targetAudience}</Text>
                </View>
              )}
            </View>
            <View style={styles.column}>
              {discovery.uniqueValueProposition && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Unique Value Proposition</Text>
                  <Text style={styles.infoText}>{discovery.uniqueValueProposition}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Current Marketing State */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Marketing State</Text>
          
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              {discovery.currentMonthlyBudget && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.infoLabel}>Monthly Budget</Text>
                  <View style={styles.budgetBadge}>
                    <Text style={styles.budgetText}>{discovery.currentMonthlyBudget}</Text>
                  </View>
                </View>
              )}
              
              {discovery.currentMarketingChannels && discovery.currentMarketingChannels.length > 0 && (
                <View>
                  <Text style={styles.infoLabel}>Current Channels</Text>
                  <View style={styles.tagContainer}>
                    {discovery.currentMarketingChannels.map((channel, idx) => (
                      <View key={idx} style={styles.tag}>
                        <Text style={styles.tagText}>{channel}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
            
            <View style={styles.column}>
              {discovery.currentPainPoints && discovery.currentPainPoints.length > 0 && (
                <View>
                  <Text style={styles.infoLabel}>Pain Points</Text>
                  {discovery.currentPainPoints.map((point, idx) => (
                    <View key={idx} style={styles.listItem}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.listText}>{point}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Existing Tools */}
        {discovery.existingTools && discovery.existingTools.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Tech Stack</Text>
            <View style={styles.tagContainer}>
              {discovery.existingTools.map((tool, idx) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{tool}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Website & Social */}
        <View style={styles.section}>
          <View style={styles.twoColumn}>
            {discovery.websiteUrl && (
              <View style={styles.column}>
                <Text style={styles.infoLabel}>Website</Text>
                <Text style={styles.infoText}>{discovery.websiteUrl}</Text>
              </View>
            )}
            {discovery.socialProfiles && (
              <View style={styles.column}>
                <Text style={styles.infoLabel}>Social Profiles</Text>
                <Text style={styles.infoText}>{discovery.socialProfiles}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Powered by ClawBot AI • Brandastic</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* Page 2: Competition, Goals & Next Steps */}
      <Page size="A4" style={styles.page}>
        <View style={[styles.header, { marginBottom: 20 }]}>
          <Text style={[styles.title, { fontSize: 18 }]}>Competition & Goals</Text>
          <Text style={styles.subtitle}>{clientName}</Text>
        </View>

        {/* Competitors */}
        {(discovery.competitors?.length || discovery.competitorAnalysis) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Competitive Landscape</Text>
            
            {discovery.competitors && discovery.competitors.length > 0 && (
              <View style={styles.tagContainer}>
                {discovery.competitors.map((competitor, idx) => (
                  <View key={idx} style={styles.competitorCard}>
                    <Text style={styles.competitorName}>{competitor}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {discovery.competitorAnalysis && (
              <View style={[styles.infoBox, { marginTop: 10 }]}>
                <Text style={styles.infoLabel}>Competitive Analysis</Text>
                <Text style={styles.infoText}>{discovery.competitorAnalysis}</Text>
              </View>
            )}
          </View>
        )}

        {/* Goals */}
        {discovery.primaryGoals && discovery.primaryGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Primary Goals</Text>
            {discovery.primaryGoals.map((goal, idx) => (
              <View key={idx} style={styles.goalCard}>
                <Text style={styles.goalText}>{goal}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Success Metrics */}
        {discovery.successMetrics && discovery.successMetrics.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Success Metrics</Text>
            {discovery.successMetrics.map((metric, idx) => (
              <View key={idx} style={styles.listItem}>
                <Text style={styles.bullet}>📊</Text>
                <Text style={styles.listText}>{metric}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Timeline */}
        {discovery.timeline && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project Timeline</Text>
            <View style={styles.budgetBadge}>
              <Text style={styles.budgetText}>{discovery.timeline}</Text>
            </View>
          </View>
        )}

        {/* Discovery Notes */}
        {discovery.discoveryNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>{discovery.discoveryNotes}</Text>
            </View>
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
