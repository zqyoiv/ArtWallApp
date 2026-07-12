// app/cleanup.tsx
import { useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../components/ScreenHeader';
import { Colors, Spacing, Typography } from '../constants/theme';
import { getOpenAIApiKey } from '../utils/config';
import { DEFAULT_WALL_ESTIMATE } from '../utils/dimensions';
import { useAppStore } from '../utils/store';
import { cleanupRoomImage, estimateBlankWallDimensions } from '../utils/openai';

export default function CleanupScreen() {
  const router = useRouter();
  const {
    roomImageUri,
    cleanedRoomUri,
    setCleanedRoomUri,
    setWallEstimate,
  } = useAppStore();

  const goToArtwork = () => router.replace('/artwork');

  const skipWithOriginal = () => {
    if (!roomImageUri) return;
    setCleanedRoomUri(roomImageUri);
    setWallEstimate(DEFAULT_WALL_ESTIMATE);
    goToArtwork();
  };

  const runCleanup = async () => {
    if (!roomImageUri) return;
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      Alert.alert(
        'No API Key',
        'Add EXPO_PUBLIC_OPENAI_API_KEY to your .env file, then restart the dev server.',
        [
          { text: 'Settings', onPress: () => router.push('/settings') },
          { text: 'Skip (use original)', onPress: skipWithOriginal },
        ]
      );
      return;
    }

    try {
      const [cleaned, wall] = await Promise.all([
        cleanupRoomImage(roomImageUri, apiKey),
        estimateBlankWallDimensions(roomImageUri, apiKey).catch(() => DEFAULT_WALL_ESTIMATE),
      ]);
      setCleanedRoomUri(cleaned);
      setWallEstimate(wall);
      goToArtwork();
    } catch (err: any) {
      Alert.alert('Cleanup Failed', err.message || 'Something went wrong.', [
        { text: 'Retry', onPress: runCleanup },
        { text: 'Skip (use original)', onPress: skipWithOriginal },
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
          Removing clutter and wall art, and estimating the blank wall size for true-to-scale
          artwork previews.
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
