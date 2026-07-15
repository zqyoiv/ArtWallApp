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
      const result = await saveImageToCameraRoll(uri);
      if (Platform.OS === 'web') {
        Alert.alert(
          result === 'shared' ? 'Share sheet opened' : 'Download started',
          result === 'shared'
            ? 'In the share sheet, tap Save Image to add this preview to your Photos.'
            : 'Check your browser downloads. On iPhone, use Share → Save Image to add it to Photos.'
        );
      } else {
        Alert.alert('Saved', 'Your preview was added to Photos.');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'SAVE_CANCELLED') {
        return;
      }
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

      // Mobile web (especially iOS Safari): prefer sharing the image file directly.
      if (Platform.OS === 'web') {
        const result = await saveImageToCameraRoll(uri);
        if (result === 'shared') {
          return;
        }
        Alert.alert(
          'Download started',
          'Sharing is limited in this browser. The image was downloaded instead.'
        );
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
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'SAVE_CANCELLED') {
        return;
      }
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
          label={Platform.OS === 'web' ? 'Save Image' : 'Save to Photos'}
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
