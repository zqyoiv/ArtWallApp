// app/settings.tsx
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Typography } from '../constants/theme';
import { getOpenAIApiKey, hasOpenAIApiKey } from '../utils/config';

function maskApiKey(key: string): string {
  if (key.length <= 11) return '••••••••';
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

export default function SettingsScreen() {
  const apiKey = getOpenAIApiKey();
  const configured = hasOpenAIApiKey();

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OpenAI API Key</Text>
          <Text style={styles.sectionDesc}>
            The key is loaded from a local <Text style={styles.mono}>.env</Text> file
            in the project folder (not stored in the app). Restart the dev server
            after you change it.
          </Text>

          <View
            style={[
              styles.statusBox,
              configured ? styles.statusOk : styles.statusMissing,
            ]}
          >
            <Text style={styles.statusLabel}>
              {configured ? '✓ Key loaded' : '✗ No key found'}
            </Text>
            {configured && (
              <Text style={styles.statusValue}>{maskApiKey(apiKey)}</Text>
            )}
          </View>

          <Text style={styles.setupTitle}>Setup</Text>
          {[
            '1. Copy .env.example to .env in the ArtWallApp folder',
            '2. Set EXPO_PUBLIC_OPENAI_API_KEY=sk-your-key-here',
            '3. Stop the dev server (Ctrl+C) and run: npx expo start',
          ].map((step) => (
            <Text key={step} style={styles.instructionStep}>
              {step}
            </Text>
          ))}

          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>
              EXPO_PUBLIC_OPENAI_API_KEY=sk-...
            </Text>
          </View>

          <Text style={styles.note}>
            Keep .env out of git — it is listed in .gitignore. Never commit your
            secret key.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to get an API key</Text>
          {[
            '1. Go to platform.openai.com',
            '2. Sign in or create an account',
            '3. Go to API Keys in your dashboard',
            '4. Click "Create new secret key"',
            '5. Paste it into your .env file',
          ].map((step) => (
            <Text key={step} style={styles.instructionStep}>
              {step}
            </Text>
          ))}
          <Text style={styles.costNote}>
            💡 Room cleanup uses GPT-Image-1, which costs roughly $0.04–0.08 per
            image edit.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.sectionDesc}>
            ArtWall uses AI to clean up your room photo, then lets you drag and
            scale artwork directly onto your wall. No AR hardware required.
          </Text>
          <Text style={styles.version}>Version 1.0.0 · MVP</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  container: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
    marginBottom: Spacing.xs,
  },
  sectionDesc: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
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
    backgroundColor: '#f0faf4',
    borderColor: '#b8e6c8',
  },
  statusMissing: {
    backgroundColor: '#fff8f0',
    borderColor: Colors.accentWarm,
  },
  statusLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  statusValue: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  codeText: {
    fontSize: Typography.sizes.sm,
    fontFamily: 'Courier',
    color: Colors.text,
  },
  note: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    lineHeight: 18,
    marginTop: Spacing.xs,
  },
  instructionStep: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  costNote: {
    fontSize: Typography.sizes.sm,
    color: Colors.accentWarm,
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
  version: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
});
