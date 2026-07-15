// app/capture.tsx
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { Colors, Radius, Shadow, Spacing, Typography } from '../constants/theme';
import { useAppStore } from '../utils/store';
import { normalizeImageForOpenAI } from '../utils/normalizeImage';
import { DEBUG_WALL_ESTIMATE } from '../utils/dimensions';
import { resolveAssetUri } from '../utils/imageUtils';
import { useRoomPreviewLayout } from '../utils/useImageAspectRatio';

const DEBUG_ROOM_SOURCE = require('../assets/test-room/02_couch_cleaned.jpg');

export default function CaptureScreen() {
  const router = useRouter();
  const { debugMode, setRoomImageUri, setCleanedRoomUri, setWallEstimate } = useAppStore();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [processingImage, setProcessingImage] = useState(false);
  const { width: previewWidth, height: previewHeight } = useRoomPreviewLayout(previewUri);

  const applyPickedImage = async (asset: ImagePicker.ImagePickerAsset) => {
    setProcessingImage(true);
    try {
      const uri = await normalizeImageForOpenAI(asset.uri, asset.mimeType);
      setPreviewUri(uri);
    } catch {
      Alert.alert('Image Error', 'Could not process this photo. Please try another image.');
    } finally {
      setProcessingImage(false);
    }
  };

  const requestPermission = async (type: 'camera' | 'library') => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  const takePhoto = async () => {
    const granted = await requestPermission('camera');
    if (!granted) {
      Alert.alert('Permission Denied', 'Camera access is required to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
      preferredAssetRepresentationMode:
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    if (!result.canceled && result.assets[0]) {
      await applyPickedImage(result.assets[0]);
    }
  };

  const pickFromLibrary = async () => {
    const granted = await requestPermission('library');
    if (!granted) {
      Alert.alert('Permission Denied', 'Photo library access is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
      preferredAssetRepresentationMode:
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    if (!result.canceled && result.assets[0]) {
      await applyPickedImage(result.assets[0]);
    }
  };

  const handleContinue = () => {
    if (!previewUri) return;
    setRoomImageUri(previewUri);
    setCleanedRoomUri(null);
    setWallEstimate(null);
    router.push('/cleanup');
  };

  const useDebugRoom = async () => {
    setProcessingImage(true);
    try {
      const uri = await resolveAssetUri(DEBUG_ROOM_SOURCE);
      if (!uri) {
        Alert.alert('Debug Error', 'Could not load the debug room image.');
        return;
      }
      setPreviewUri(uri);
      setRoomImageUri(uri);
      setCleanedRoomUri(uri);
      setWallEstimate(DEBUG_WALL_ESTIMATE);
      router.push('/artwork');
    } catch {
      Alert.alert('Debug Error', 'Could not load the debug room image.');
    } finally {
      setProcessingImage(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Capture Room" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {debugMode ? (
          <PrimaryButton
            label="Use Debug Room"
            onPress={useDebugRoom}
            loading={processingImage}
            disabled={processingImage}
          />
        ) : (
          <View style={styles.tipsBox}>
            <Text style={styles.tipsTitle}>For best results</Text>
            {[
              'Face the wall directly',
              'Use good natural lighting',
              'Landscape orientation works best',
            ].map((tip) => (
              <Text key={tip} style={styles.tipItem}>
                · {tip}
              </Text>
            ))}
          </View>
        )}

        <View style={[styles.previewContainer, { width: previewWidth, height: previewHeight }]}>
          {processingImage ? (
            <View style={styles.previewPlaceholder}>
              <ActivityIndicator size="large" color={Colors.textMuted} />
              <Text style={styles.placeholderText}>Processing photo…</Text>
            </View>
          ) : previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.preview} resizeMode="contain" />
          ) : (
            <View style={styles.previewPlaceholder}>
              <Ionicons name="home-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.placeholderText}>No photo selected</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={takePhoto} activeOpacity={0.85}>
            <Ionicons name="camera-outline" size={28} color={Colors.text} />
            <Text style={styles.actionLabel}>Camera</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionBtn} onPress={pickFromLibrary} activeOpacity={0.85}>
            <Ionicons name="images-outline" size={28} color={Colors.text} />
            <Text style={styles.actionLabel}>Gallery</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="Continue"
          onPress={handleContinue}
          disabled={!previewUri || processingImage}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.lg,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  tipsBox: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  tipsTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  tipItem: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  previewContainer: {
    alignSelf: 'center',
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceMuted,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  placeholderText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.card,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.xs,
  },
  actionLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: '500',
    color: Colors.text,
  },
  divider: {
    width: 1,
    backgroundColor: Colors.border,
  },
});
