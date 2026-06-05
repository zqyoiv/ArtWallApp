// app/cleanup.tsx
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Typography } from '../constants/theme';
import { getOpenAIApiKey } from '../utils/config';
import { useAppStore } from '../utils/store';
import { cleanupRoomImage, uriToBase64 } from '../utils/openai';

const { width } = Dimensions.get('window');
const IMG_HEIGHT = width * (9 / 16); // 16:9 preview

export default function CleanupScreen() {
  const router = useRouter();
  const { roomImageUri, cleanedRoomUri, setCleanedRoomUri } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const runCleanup = async () => {
    if (!roomImageUri) return;
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      Alert.alert(
        'No API Key',
        'Add EXPO_PUBLIC_OPENAI_API_KEY to your .env file, then restart the dev server.',
        [
          { text: 'Settings', onPress: () => router.push('/settings') },
          { text: 'Skip (use original)', onPress: () => {
            setCleanedRoomUri(roomImageUri);
            router.push('/artwork');
          }},
        ]
      );
      return;
    }

    setLoading(true);
    try {
      const base64 = await uriToBase64(roomImageUri);
      const cleaned = await cleanupRoomImage(base64, apiKey);
      setCleanedRoomUri(cleaned);
      setShowComparison(true);
    } catch (err: any) {
      Alert.alert('Cleanup Failed', err.message || 'Something went wrong.', [
        { text: 'Retry', onPress: runCleanup },
        {
          text: 'Skip (use original)',
          onPress: () => {
            setCleanedRoomUri(roomImageUri);
            router.push('/artwork');
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-run on mount if we don't have a cleaned image yet
  useEffect(() => {
    if (!cleanedRoomUri) {
      runCleanup();
    } else {
      setShowComparison(true);
    }
  }, []);

  const handleContinue = () => {
    if (!cleanedRoomUri) return;
    router.push('/artwork');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={Colors.accentGold} />
            <Text style={styles.loadingTitle}>Cleaning up your room…</Text>
            <Text style={styles.loadingDesc}>
              AI is removing clutter while preserving your space. This takes 15–30 seconds.
            </Text>
          </View>
        ) : showComparison ? (
          <View style={styles.comparisonContainer}>
            <Text style={styles.sectionLabel}>Before</Text>
            <View style={styles.imgBox}>
              {roomImageUri && (
                <Image source={{ uri: roomImageUri }} style={styles.img} resizeMode="cover" />
              )}
            </View>

            <View style={styles.arrowRow}>
              <View style={styles.arrowLine} />
              <Text style={styles.arrowText}>AI Cleanup</Text>
              <View style={styles.arrowLine} />
            </View>

            <Text style={styles.sectionLabel}>After</Text>
            <View style={styles.imgBox}>
              {cleanedRoomUri && (
                <Image
                  source={{ uri: cleanedRoomUri }}
                  style={styles.img}
                  resizeMode="cover"
                />
              )}
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.continueBtn}
                onPress={handleContinue}
                activeOpacity={0.85}
              >
                <Text style={styles.continueBtnText}>Add Artwork →</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.retryBtn}
                onPress={runCleanup}
                activeOpacity={0.8}
              >
                <Text style={styles.retryBtnText}>Run Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.loadingState}>
            <Text style={styles.loadingTitle}>Ready to clean up</Text>
            <TouchableOpacity style={styles.continueBtn} onPress={runCleanup}>
              <Text style={styles.continueBtnText}>Run AI Cleanup</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    flexGrow: 1,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing['2xl'],
  },
  loadingTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '300',
    color: Colors.text,
    textAlign: 'center',
  },
  loadingDesc: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  comparisonContainer: {
    gap: Spacing.md,
  },
  sectionLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  imgBox: {
    width: '100%',
    height: IMG_HEIGHT,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.border,
  },
  img: { width: '100%', height: '100%' },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  arrowLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.accentGold,
    opacity: 0.5,
  },
  arrowText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    color: Colors.accentGold,
    letterSpacing: 1,
  },
  buttonGroup: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  continueBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: Typography.sizes.base,
  },
  retryBtn: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  retryBtnText: {
    color: Colors.text,
    fontWeight: '500',
    fontSize: Typography.sizes.base,
  },
});
