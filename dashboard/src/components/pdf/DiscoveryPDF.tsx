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
  coverGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.dark,
  },
  coverContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },
  coverLogo: {
    width: 120,
    height: 120,
    marginBottom: 40,
    borderRadius: 20,
  },
  coverLetterLogo: {
    width: 120,
    height: 120,
    marginBottom: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverLogoText: {
    color: COLORS.white,
    fontSize: 60,
    fontWeight: 700,
  },
  coverTitle: {
    fontSize: 42,
    fontWeight: 700,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 10,
  },
  coverSubtitle: {
    fontSize: 18,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 60,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  coverClientName: {
    fontSize: 28,
    fontWeight: 600,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  coverDate: {
    fontSize: 14,
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
    fontSize: 12,
    color: COLORS.gray,
    letterSpacing: 2,
  },

  // Content Pages
  page: {
    padding: 50,
    fontSize: 11,
    color: COLORS.dark,
    backgroundColor: COLORS.white,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: COLORS.dark,
  },
  pageSubtitle: {
    fontSize: 11,
    color: COLORS.gray,
  },

  // Sections
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.primary,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionContent: {
    fontSize: 11,
    lineHeight: 1.6,
    color: COLORS.dark,
  },

  // Cards
  infoCard: {
    backgroundColor: COLORS.lightGray,
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
  },
  infoCardAccent: {
    backgroundColor: '#ecfdf5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: 600,
    color: COLORS.gray,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 11,
    lineHeight: 1.5,
    color: COLORS.dark,
  },

  // Two Column Layout
  twoColumn: {
    flexDirection: 'row',
    gap: 20,
  },
  column: {
    flex: 1,
  },

  // Tags/Pills
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 9,
    color: '#1d4ed8',
    fontWeight: 500,
  },
  tagPurple: {
    backgroundColor: '#ede9fe',
  },
  tagPurpleText: {
    color: '#7c3aed',
  },

  // Lists
  listItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 5,
  },
  bullet: {
    width: 18,
    fontSize: 11,
    color: COLORS.primary,
  },
  listText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.5,
    color: COLORS.dark,
  },

  // Goals Cards
  goalCard: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  goalText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: 500,
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

  // Highlight Box
  highlightBox: {
    backgroundColor: '#fef3c7',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    marginBottom: 15,
  },
  highlightText: {
    fontSize: 11,
    color: '#92400e',
    lineHeight: 1.5,
  },

  // Competitor Card
  competitorCard: {
    backgroundColor: COLORS.lightGray,
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  competitorBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginRight: 10,
  },
  competitorName: {
    fontSize: 11,
    fontWeight: 500,
    color: COLORS.dark,
  },
});

interface DiscoveryPDFProps {
  discovery: {
    businessDescription?: string;
    targetAudience?: string;
    uniqueValueProposition?: string;
    industry?: string;
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
    tone?: string;
    keywords?: string[];
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
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverGradient} />
        <View style={styles.coverContent}>
          {clientLogo ? (
            <Image src={clientLogo} style={styles.coverLogo} />
          ) : (
            <View style={styles.coverLetterLogo}>
              <Text style={styles.coverLogoText}>{clientName?.charAt(0) || 'C'}</Text>
            </View>
          )}
          <Text style={styles.coverSubtitle}>Discovery Document</Text>
          <Text style={styles.coverTitle}>{clientName}</Text>
          <Text style={styles.coverDate}>{clientIndustry || 'Marketing Strategy'}</Text>
          <Text style={[styles.coverDate, { marginTop: 20 }]}>{today}</Text>
        </View>
        <View style={styles.coverFooter}>
          <Text style={styles.coverBrandastic}>POWERED BY BRANDASTIC</Text>
        </View>
      </Page>

      {/* Page 1: Business Overview */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>Business Overview</Text>
            <Text style={styles.pageSubtitle}>{clientName}</Text>
          </View>
        </View>

        {discovery.businessDescription && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About the Business</Text>
            <View style={styles.highlightBox}>
              <Text style={styles.highlightText}>{discovery.businessDescription}</Text>
            </View>
          </View>
        )}

        <View style={styles.twoColumn}>
          <View style={styles.column}>
            {discovery.targetAudience && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Target Audience</Text>
                <View style={styles.infoCard}>
                  <Text style={styles.infoText}>{discovery.targetAudience}</Text>
                </View>
              </View>
            )}
          </View>
          <View style={styles.column}>
            {discovery.uniqueValueProposition && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Value Proposition</Text>
                <View style={styles.infoCardAccent}>
                  <Text style={styles.infoText}>{discovery.uniqueValueProposition}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {discovery.currentMarketingChannels && discovery.currentMarketingChannels.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Marketing Channels</Text>
            <View style={styles.tagContainer}>
              {discovery.currentMarketingChannels.map((channel, idx) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{channel}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {discovery.existingTools && discovery.existingTools.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tech Stack & Tools</Text>
            <View style={styles.tagContainer}>
              {discovery.existingTools.map((tool, idx) => (
                <View key={idx} style={[styles.tag, styles.tagPurple]}>
                  <Text style={[styles.tagText, styles.tagPurpleText]}>{tool}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {discovery.currentPainPoints && discovery.currentPainPoints.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Challenges</Text>
            {discovery.currentPainPoints.map((point, idx) => (
              <View key={idx} style={styles.listItem}>
                <Text style={styles.bullet}>▸</Text>
                <Text style={styles.listText}>{point}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Confidential • Brandastic Discovery Document</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>

      {/* Page 2: Goals & Competition */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>Goals & Competition</Text>
            <Text style={styles.pageSubtitle}>{clientName}</Text>
          </View>
        </View>

        {discovery.primaryGoals && discovery.primaryGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Primary Goals</Text>
            {discovery.primaryGoals.map((goal, idx) => (
              <View key={idx} style={styles.goalCard}>
                <Text style={styles.goalText}>{idx + 1}. {goal}</Text>
              </View>
            ))}
          </View>
        )}

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

        {discovery.competitors && discovery.competitors.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Competitive Landscape</Text>
            {discovery.competitors.map((competitor, idx) => (
              <View key={idx} style={styles.competitorCard}>
                <View style={styles.competitorBullet} />
                <Text style={styles.competitorName}>{competitor}</Text>
              </View>
            ))}
          </View>
        )}

        {discovery.competitorAnalysis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Competitive Analysis</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>{discovery.competitorAnalysis}</Text>
            </View>
          </View>
        )}

        <View style={styles.twoColumn}>
          {discovery.timeline && (
            <View style={styles.column}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Timeline</Text>
                <View style={[styles.tag, { alignSelf: 'flex-start', paddingHorizontal: 15, paddingVertical: 8 }]}>
                  <Text style={[styles.tagText, { fontSize: 12, fontWeight: 600 }]}>{discovery.timeline}</Text>
                </View>
              </View>
            </View>
          )}
          {discovery.currentMonthlyBudget && (
            <View style={styles.column}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Budget</Text>
                <View style={[styles.tag, styles.tagPurple, { alignSelf: 'flex-start', paddingHorizontal: 15, paddingVertical: 8 }]}>
                  <Text style={[styles.tagText, styles.tagPurpleText, { fontSize: 12, fontWeight: 600 }]}>{discovery.currentMonthlyBudget}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {discovery.discoveryNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>{discovery.discoveryNotes}</Text>
            </View>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Confidential • Brandastic Discovery Document</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
