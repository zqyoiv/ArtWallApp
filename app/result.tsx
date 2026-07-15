// app/result.tsx
import { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  Platform,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';
import { useAppStore } from '../utils/store';
import { saveImageToCameraRoll } from '../utils/saveToLibrary';
import { useRoomPreviewLayout } from '../utils/useImageAspectRatio';
import { captureViewToDataUri } from '../utils/captureView';
import {
  canShareImageFile,
  shareImageFile,
  uriToImageFile,
  downloadImageFile,
  isIosSafari,
} from '../utils/webShareImage';

export default function ResultScreen() {
  const router = useRouter();
  const { finalImageUri, reset } = useAppStore();
  const previewRef = useRef<View>(null);
  const preparedFileRef = useRef<Awaited<ReturnType<typeof uriToImageFile>> | null>(null);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [fileReady, setFileReady] = useState(false);
  const { width: previewWidth, height: previewHeight } = useRoomPreviewLayout(finalImageUri);

  // Prefetch File so Save/Share can call navigator.share() immediately on tap
  // (iOS Safari drops the share sheet if too much async happens after the gesture).
  useEffect(() => {
    let cancelled = false;
    preparedFileRef.current = null;
    setFileReady(false);

    if (Platform.OS !== 'web' || !finalImageUri) return;

    uriToImageFile(finalImageUri)
      .then((file) => {
        if (cancelled) return;
        preparedFileRef.current = file;
        setFileReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          preparedFileRef.current = null;
          setFileReady(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [finalImageUri]);

  const resolveCaptureUri = async (): Promise<string | null> => {
    if (finalImageUri) {
      return finalImageUri;
    }
    if (!previewRef.current) {
      return null;
    }
    return captureViewToDataUri(previewRef, { format: 'png', quality: 1 });
  };

  const sharePreparedOrUri = async (uri: string | null): Promise<'shared' | 'downloaded'> => {
    const prepared = preparedFileRef.current;
    if (prepared && canShareImageFile(prepared)) {
      // No await before this — critical for iOS Safari.
      await shareImageFile(prepared);
      return 'shared';
    }
    if (!uri) {
      throw new Error('Nothing to save');
    }
    return saveImageToCameraRoll(uri);
  };

  const handleSaveToLibrary = async () => {
    // On web, share BEFORE any setState so the user gesture stays valid on iOS Safari.
    if (Platform.OS === 'web') {
      try {
        const prepared = preparedFileRef.current;
        if (prepared && canShareImageFile(prepared)) {
          await shareImageFile(prepared);
          return;
        }

        const uri = finalImageUri ?? (await resolveCaptureUri());
        if (!uri) {
          Alert.alert('Nothing to save', 'Go back and tap Save Preview on the placement screen.');
          return;
        }

        const result = await saveImageToCameraRoll(uri);
        if (result === 'downloaded') {
          Alert.alert(
            isIosSafari() ? 'Long-press the image' : 'Download started',
            isIosSafari()
              ? 'This browser blocked the share sheet. Long-press the preview above, then tap Add to Photos.'
              : 'Check your browser downloads.'
          );
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'SAVE_CANCELLED') return;
        const message = err instanceof Error ? err.message : 'Could not save image.';
        Alert.alert('Save Failed', message);
      }
      return;
    }

    setSaving(true);
    try {
      const uri = await resolveCaptureUri();
      if (!uri) {
        Alert.alert('Nothing to save', 'Go back and tap Save Preview on the placement screen.');
        return;
      }
      await saveImageToCameraRoll(uri);
      Alert.alert('Saved', 'Your preview was added to Photos.');
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'SAVE_CANCELLED') return;
      const message = err instanceof Error ? err.message : 'Could not save to Photos.';
      Alert.alert('Save Failed', message);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (Platform.OS === 'web') {
      try {
        await sharePreparedOrUri(finalImageUri);
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'SAVE_CANCELLED') return;
        try {
          if (preparedFileRef.current) {
            await downloadImageFile(preparedFileRef.current);
          }
        } catch {
          // ignore
        }
        Alert.alert(
          isIosSafari() ? 'Long-press the image' : 'Share unavailable',
          isIosSafari()
            ? 'Long-press the preview above, then tap Add to Photos or Share.'
            : 'Could not open the share sheet in this browser.'
        );
      }
      return;
    }

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
    router.replace('/');
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
          <Image
            source={{ uri: finalImageUri }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        </View>

        {Platform.OS === 'web' ? (
          <Text style={styles.webHint}>
            {fileReady
              ? 'Tap Save to Photos, then choose Save Image in the share sheet.'
              : 'Preparing image…'}
          </Text>
        ) : null}

        <PrimaryButton
          label={Platform.OS === 'web' ? 'Save to Photos' : 'Save to Photos'}
          onPress={handleSaveToLibrary}
          loading={saving}
          disabled={saving || sharing || (Platform.OS === 'web' && !fileReady)}
        />
        <PrimaryButton
          label="Share"
          onPress={handleShare}
          variant="secondary"
          loading={sharing}
          disabled={saving || sharing || (Platform.OS === 'web' && !fileReady)}
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
  webHint: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },
});
