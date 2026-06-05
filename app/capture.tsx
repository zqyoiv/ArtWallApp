// app/capture.tsx
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, Radius, Typography } from '../constants/theme';
import { useAppStore } from '../utils/store';

const { width } = Dimensions.get('window');
const PREVIEW_HEIGHT = width * 0.75;

export default function CaptureScreen() {
  const router = useRouter();
  const { setRoomImageUri, setCleanedRoomUri } = useAppStore();
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const requestPermission = async (type: 'camera' | 'library') => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    }
  };

  const takePhoto = async () => {
    const granted = await requestPermission('camera');
    if (!granted) {
      Alert.alert('Permission Denied', 'Camera access is required to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.92,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setPreviewUri(result.assets[0].uri);
    }
  };

  const pickFromLibrary = async () => {
    const granted = await requestPermission('library');
    if (!granted) {
      Alert.alert('Permission Denied', 'Photo library access is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.92,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setPreviewUri(result.assets[0].uri);
    }
  };

  const handleContinue = () => {
    if (!previewUri) return;
    setRoomImageUri(previewUri);
    setCleanedRoomUri(null); // reset any previous cleanup
    router.push('/cleanup');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        {/* Tips */}
        <View style={styles.tipsBox}>
          <Text style={styles.tipsTitle}>For best results</Text>
          {[
            'Face the wall directly',
            'Good natural lighting',
            'Landscape or portrait both work',
          ].map((tip) => (
            <Text key={tip} style={styles.tipItem}>
              · {tip}
            </Text>
          ))}
        </View>

        {/* Preview area */}
        <View style={styles.previewContainer}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.preview} resizeMode="cover" />
          ) : (
            <View style={styles.previewPlaceholder}>
              <Text style={styles.placeholderIcon}>🏠</Text>
              <Text style={styles.placeholderText}>No photo selected</Text>
            </View>
          )}
        </View>

        {/* Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={takePhoto} activeOpacity={0.8}>
            <Text style={styles.actionIcon}>📷</Text>
            <Text style={styles.actionLabel}>Camera</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionBtn} onPress={pickFromLibrary} activeOpacity={0.8}>
            <Text style={styles.actionIcon}>🖼</Text>
            <Text style={styles.actionLabel}>Library</Text>
          </TouchableOpacity>
        </View>

        {previewUri && (
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>Use This Photo →</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  tipsBox: {
    backgroundColor: Colors.surfaceWarm,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tipsTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  tipItem: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  previewContainer: {
    width: '100%',
    height: PREVIEW_HEIGHT,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.border,
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
  placeholderIcon: { fontSize: 48 },
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
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.xs,
  },
  actionIcon: { fontSize: 28 },
  actionLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  divider: {
    width: 1,
    backgroundColor: Colors.border,
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
    letterSpacing: 0.2,
  },
});
