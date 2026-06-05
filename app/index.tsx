// app/index.tsx
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../components/PrimaryButton';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';
import { hasOpenAIApiKey } from '../utils/config';

const STEPS = [
  { num: '01', label: 'Capture room', desc: 'Photo or camera' },
  { num: '02', label: 'AI cleanup', desc: 'Blank wall preview' },
  { num: '03', label: 'Add artwork', desc: 'Gallery or samples' },
  { num: '04', label: 'Place & preview', desc: 'Drag and scale' },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>ArtWall</Text>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => router.push('/settings')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="settings-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>See art on{'\n'}your wall</Text>
        <Text style={styles.subtitle}>
          Capture your space, clean the wall with AI, then preview artwork before you hang it.
        </Text>

        <View style={styles.steps}>
          {STEPS.map((step) => (
            <View key={step.num} style={styles.stepRow}>
              <Text style={styles.stepNum}>{step.num}</Text>
              <View>
                <Text style={styles.stepLabel}>{step.label}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {!hasOpenAIApiKey() && (
          <TouchableOpacity
            style={styles.warningBanner}
            onPress={() => router.push('/settings')}
          >
            <Text style={styles.warningText}>
              Add EXPO_PUBLIC_OPENAI_API_KEY to .env for AI cleanup
            </Text>
          </TouchableOpacity>
        )}

        <PrimaryButton label="Start Preview" onPress={() => router.push('/capture')} />

        <Text style={styles.footer}>Your photos stay on your device.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  brand: {
    fontSize: Typography.sizes.md,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  steps: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  stepNum: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    width: 24,
  },
  stepLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text,
  },
  stepDesc: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  warningBanner: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  warningText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
