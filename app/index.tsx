// app/index.tsx
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Typography } from '../constants/theme';
import { hasOpenAIApiKey } from '../utils/config';

const { width } = Dimensions.get('window');

const STEPS = [
  { num: '01', label: 'Capture Room', desc: 'Photo or camera' },
  { num: '02', label: 'AI Cleanup', desc: 'Remove clutter' },
  { num: '03', label: 'Add Artwork', desc: 'From your library' },
  { num: '04', label: 'Place & Preview', desc: 'Drag, scale, rotate' },
  { num: '05', label: 'Save & Share', desc: 'Export your vision' },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/settings')}
          >
            <Text style={styles.settingsBtnText}>⚙</Text>
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>AI Art Preview</Text>
          <Text style={styles.title}>See it{'\n'}on your{'\n'}wall.</Text>
          <Text style={styles.subtitle}>
            Visualize any artwork in your space before you buy, print, or hang it.
          </Text>
        </View>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          {STEPS.map((step, i) => (
            <View key={step.num} style={styles.stepRow}>
              <View style={styles.stepNumContainer}>
                <Text style={styles.stepNum}>{step.num}</Text>
                {i < STEPS.length - 1 && <View style={styles.stepLine} />}
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepLabel}>{step.label}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* API key warning */}
        {!hasOpenAIApiKey() && (
          <TouchableOpacity
            style={styles.warningBanner}
            onPress={() => router.push('/settings')}
          >
            <Text style={styles.warningText}>
              ⚠ Add EXPO_PUBLIC_OPENAI_API_KEY to .env to enable AI cleanup
            </Text>
          </TouchableOpacity>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push('/capture')}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>Start Preview</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Your photos are processed privately and never stored.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBtnText: {
    fontSize: 22,
  },
  hero: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  eyebrow: {
    fontSize: Typography.sizes.sm,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.accentWarm,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: '300',
    color: Colors.text,
    lineHeight: 44,
    letterSpacing: -1,
    marginBottom: Spacing.lg,
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    lineHeight: 24,
    maxWidth: width * 0.75,
  },
  stepsContainer: {
    marginBottom: Spacing.xl,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  stepNumContainer: {
    alignItems: 'center',
    width: 48,
    marginRight: Spacing.md,
  },
  stepNum: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    color: Colors.accentGold,
    letterSpacing: 1,
    width: 28,
    height: 28,
    textAlign: 'center',
    lineHeight: 28,
  },
  stepLine: {
    width: 1,
    flex: 1,
    minHeight: 24,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  stepContent: {
    paddingBottom: Spacing.lg,
    paddingTop: 4,
  },
  stepLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
  },
  warningBanner: {
    backgroundColor: '#FEF3E2',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#F0D9A8',
  },
  warningText: {
    fontSize: Typography.sizes.sm,
    color: '#8B6914',
    lineHeight: 20,
  },
  ctaButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  footer: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
