// app/cleanup.tsx
import { useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../components/ScreenHeader';
import { Colors, Spacing, Typography } from '../constants/theme';
import { getOpenAIApiKey } from '../utils/config';
import { useAppStore } from '../utils/store';
import { cleanupRoomImage, uriToBase64 } from '../utils/openai';

export default function CleanupScreen() {
  const router = useRouter();
  const { roomImageUri, cleanedRoomUri, setCleanedRoomUri } = useAppStore();

  const goToArtwork = () => router.replace('/artwork');

  const runCleanup = async () => {
    if (!roomImageUri) return;
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      Alert.alert(
        'No API Key',
        'Add EXPO_PUBLIC_OPENAI_API_KEY to your .env file, then restart the dev server.',
        [
          { text: 'Settings', onPress: () => router.push('/settings') },
          {
            text: 'Skip (use original)',
            onPress: () => {
              setCleanedRoomUri(roomImageUri);
              goToArtwork();
            },
          },
        ]
      );
      return;
    }

    try {
      const base64 = await uriToBase64(roomImageUri);
      const cleaned = await cleanupRoomImage(base64, apiKey);
      setCleanedRoomUri(cleaned);
      goToArtwork();
    } catch (err: any) {
      Alert.alert('Cleanup Failed', err.message || 'Something went wrong.', [
        { text: 'Retry', onPress: runCleanup },
        {
          text: 'Skip (use original)',
          onPress: () => {
            setCleanedRoomUri(roomImageUri);
            goToArtwork();
          },
        },
      ]);
    }
  };

  useEffect(() => {
    if (cleanedRoomUri) {
      goToArtwork();
    } else {
      runCleanup();
    }
  }, []);

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Processing" showBack />
      <View style={styles.body}>
        <ActivityIndicator size="large" color={Colors.text} style={styles.spinner} />
        <Text style={styles.title}>Cleaning up your room</Text>
        <Text style={styles.desc}>
          Removing clutter and wall art so you can preview new pieces on a blank wall.
        </Text>
        <Text style={styles.hint}>This usually takes 15–30 seconds</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  spinner: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  desc: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  hint: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
});
