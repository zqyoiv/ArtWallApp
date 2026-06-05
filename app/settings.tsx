// app/settings.tsx
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';
import { getOpenAIApiKey, hasOpenAIApiKey } from '../utils/config';

function maskApiKey(key: string): string {
  if (key.length <= 11) return '••••••••';
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

export default function SettingsScreen() {
  const apiKey = getOpenAIApiKey();
  const configured = hasOpenAIApiKey();

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Settings" />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OpenAI API Key</Text>
          <Text style={styles.sectionDesc}>
            Loaded from <Text style={styles.mono}>.env</Text> in the project folder. Restart
            the dev server after editing.
          </Text>

          <View
            style={[
              styles.statusBox,
              configured ? styles.statusOk : styles.statusMissing,
            ]}
          >
            <Text style={styles.statusLabel}>
              {configured ? 'Key loaded' : 'No key found'}
            </Text>
            {configured && (
              <Text style={styles.statusValue}>{maskApiKey(apiKey)}</Text>
            )}
          </View>

          <Text style={styles.setupTitle}>Setup</Text>
          {[
            '1. Copy .env.example to .env',
            '2. Set EXPO_PUBLIC_OPENAI_API_KEY=sk-...',
            '3. Restart: npx expo start',
          ].map((step) => (
            <Text key={step} style={styles.instructionStep}>
              {step}
            </Text>
          ))}

          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>EXPO_PUBLIC_OPENAI_API_KEY=sk-...</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.sectionDesc}>
            ArtWall cleans your room photo with AI, then lets you place artwork on the wall.
          </Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  sectionDesc: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  mono: {
    fontFamily: 'Courier',
    color: Colors.text,
  },
  statusBox: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
  },
  statusOk: {
    backgroundColor: Colors.surfaceMuted,
    borderColor: Colors.border,
  },
  statusMissing: {
    backgroundColor: Colors.surfaceMuted,
    borderColor: Colors.border,
  },
  statusLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  statusValue: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    fontFamily: 'Courier',
    marginTop: Spacing.xs,
  },
  setupTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  codeBlock: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  codeText: {
    fontSize: Typography.sizes.sm,
    fontFamily: 'Courier',
    color: Colors.text,
  },
  instructionStep: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  version: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
});
