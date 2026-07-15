// app/result.tsx
import { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { Colors, Radius, Spacing } from '../constants/theme';
import { useAppStore } from '../utils/store';
import { saveImageToCameraRoll } from '../utils/saveToLibrary';
import { useRoomPreviewLayout } from '../utils/useImageAspectRatio';

export default function ResultScreen() {
  const router = useRouter();
  const { finalImageUri, reset } = useAppStore();
  const previewRef = useRef<View>(null);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const { width: previewWidth, height: previewHeight } = useRoomPreviewLayout(finalImageUri);

  const resolveCaptureUri = async (): Promise<string | null> => {
    if (finalImageUri) {
      return finalImageUri;
    }
    if (!previewRef.current) {
      return null;
    }
    return captureRef(previewRef, { format: 'png', quality: 1 });
  };

  const handleSaveToLibrary = async () => {
    setSaving(true);
    try {
      const uri = await resolveCaptureUri();
      if (!uri) {
        Alert.alert('Nothing to save', 'Go back and tap Save Preview on the placement screen.');
        return;
      }
      await saveImageToCameraRoll(uri);
      Alert.alert(
        'Saved',
        Platform.OS === 'web'
          ? 'Your preview download has started.'
          : 'Your preview was added to Photos.'
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not save to Photos.';
      Alert.alert('Save Failed', message);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const uri = await resolveCaptureUri();
      if (!uri) {
        Alert.alert('Nothing to share', 'Go back and tap Save Preview on the placement screen.');
        return;
      }
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Sharing unavailable', 'Sharing is not supported on this device.');
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your wall preview',
      });
    } catch {
      // user cancelled or share failed silently
    } finally {
      setSharing(false);
    }
  };

  const handleStartOver = () => {
    reset();
    router.dismissAll();
  };

  if (!finalImageUri) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Your Preview" />
        <View style={styles.fallback}>
          <PrimaryButton label="Adjust Placement" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Your Preview" />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View
          ref={previewRef}
          collapsable={false}
          style={[styles.previewBox, { width: previewWidth, height: previewHeight }]}
        >
          <Image source={{ uri: finalImageUri }} style={styles.previewImage} resizeMode="contain" />
        </View>

        <PrimaryButton
          label="Save to Photos"
          onPress={handleSaveToLibrary}
          loading={saving}
          disabled={saving || sharing}
        />
        <PrimaryButton
          label="Share"
          onPress={handleShare}
          variant="secondary"
          loading={sharing}
          disabled={saving || sharing}
        />
        <PrimaryButton label="Adjust Placement" onPress={() => router.back()} variant="ghost" />
        <PrimaryButton label="Start Over" onPress={handleStartOver} variant="ghost" />
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
    gap: Spacing.sm,
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  previewBox: {
    alignSelf: 'center',
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceMuted,
    marginBottom: Spacing.md,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
});
