// app/artwork.tsx
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Spacing, Radius, Typography } from '../constants/theme';
import { useAppStore } from '../utils/store';

const { width } = Dimensions.get('window');
const PREVIEW_SIZE = width * 0.6;

// Sample artworks for demo (public domain / placeholder colors)
const SAMPLE_ARTWORKS = [
  { id: '1', label: 'Abstract Blue', color: '#4A6FA5', emoji: '🎨' },
  { id: '2', label: 'Warm Geometry', color: '#C4856A', emoji: '🔶' },
  { id: '3', label: 'Forest Green', color: '#2D6A4F', emoji: '🌿' },
  { id: '4', label: 'Minimal Black', color: '#1A1A1A', emoji: '⬛' },
];

export default function ArtworkScreen() {
  const router = useRouter();
  const { setArtworkUri } = useAppStore();
  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Photo library access is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedUri(result.assets[0].uri);
      setSelectedSample(null);
    }
  };

  const pickFromFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'image/webp'],
      });
      if (result.assets && result.assets[0]) {
        setSelectedUri(result.assets[0].uri);
        setSelectedSample(null);
      }
    } catch {
      Alert.alert('Error', 'Could not open file picker.');
    }
  };

  const selectSample = (id: string) => {
    setSelectedSample(id);
    // For demo samples, we'll use a placeholder URI — in production connect to real assets
    setSelectedUri(`sample:${id}`);
  };

  const handleContinue = () => {
    if (!selectedUri) return;
    setArtworkUri(selectedUri);
    router.push('/place');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Upload options */}
        <View style={styles.uploadRow}>
          <TouchableOpacity style={styles.uploadBtn} onPress={pickFromLibrary} activeOpacity={0.8}>
            <Text style={styles.uploadIcon}>🖼</Text>
            <Text style={styles.uploadLabel}>My Photos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadBtn} onPress={pickFromFiles} activeOpacity={0.8}>
            <Text style={styles.uploadIcon}>📁</Text>
            <Text style={styles.uploadLabel}>Files</Text>
          </TouchableOpacity>
        </View>

        {/* Preview */}
        {selectedUri && !selectedUri.startsWith('sample:') && (
          <View style={styles.previewBox}>
            <Text style={styles.sectionLabel}>Selected Artwork</Text>
            <View style={styles.previewImg}>
              <Image source={{ uri: selectedUri }} style={styles.img} resizeMode="contain" />
            </View>
          </View>
        )}

        {/* Sample artworks */}
        <View>
          <Text style={styles.sectionLabel}>Sample Artwork (for demo)</Text>
          <Text style={styles.sectionDesc}>
            Use these to test placement. Upload your own artwork for real previews.
          </Text>
          <View style={styles.samplesGrid}>
            {SAMPLE_ARTWORKS.map((art) => (
              <TouchableOpacity
                key={art.id}
                style={[
                  styles.sampleCard,
                  selectedSample === art.id && styles.sampleCardSelected,
                ]}
                onPress={() => selectSample(art.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.sampleColor, { backgroundColor: art.color }]}>
                  <Text style={styles.sampleEmoji}>{art.emoji}</Text>
                </View>
                <Text style={styles.sampleLabel}>{art.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {selectedUri && (
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>Place on Wall →</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.lg, gap: Spacing.xl },
  uploadRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  uploadBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  uploadIcon: { fontSize: 32 },
  uploadLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  previewBox: { gap: Spacing.sm },
  previewImg: {
    width: '100%',
    height: PREVIEW_SIZE,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: { width: '100%', height: '100%' },
  sectionLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  sectionDesc: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  samplesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  sampleCard: {
    width: (width - Spacing.lg * 2 - Spacing.sm) / 2,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: Colors.surface,
  },
  sampleCardSelected: {
    borderColor: Colors.accentGold,
  },
  sampleColor: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sampleEmoji: { fontSize: 36 },
  sampleLabel: {
    padding: Spacing.sm,
    fontSize: Typography.sizes.sm,
    fontWeight: '500',
    color: Colors.text,
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
});
