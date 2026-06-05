// app/result.tsx
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
  ScrollView,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';
import { ALL_SAMPLE_ARTWORKS } from '../constants/artworks';
import { useAppStore } from '../utils/store';

const { width } = Dimensions.get('window');
const PREVIEW_HEIGHT = (width - Spacing.lg * 2) * (9 / 16);

const SAMPLE_COLORS = Object.fromEntries(
  ALL_SAMPLE_ARTWORKS.map((a) => [a.id, a.color])
);

export default function ResultScreen() {
  const router = useRouter();
  const { cleanedRoomUri, artworkUri, placement, reset } = useAppStore();

  const handleSaveToLibrary = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Photo library write access is required to save.');
      return;
    }
    Alert.alert(
      'Saved! (Demo)',
      'In the full version, the composite image would be saved to your Camera Roll using expo-view-shot.',
      [{ text: 'OK' }]
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Check out how this artwork looks on my wall! Preview made with ArtWall.',
        title: 'My Artwork Preview',
      });
    } catch {
      // cancelled
    }
  };

  const handleStartOver = () => {
    reset();
    router.dismissAll();
  };

  const isSample = artworkUri?.startsWith('sample:');
  const sampleId = isSample ? artworkUri?.split(':')[1] : null;
  const sampleColor = sampleId ? SAMPLE_COLORS[sampleId] ?? '#4A6FA5' : '#4A6FA5';

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Your Preview" />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.previewBox}>
          {cleanedRoomUri ? (
            <Image source={{ uri: cleanedRoomUri }} style={styles.roomImg} resizeMode="cover" />
          ) : (
            <View style={styles.roomPlaceholder} />
          )}

          <View
            style={[
              styles.artworkOverlay,
              {
                transform: [
                  { translateX: placement.x },
                  { translateY: placement.y },
                  { scale: placement.scale },
                  { rotate: `${placement.rotation}rad` },
                ],
              },
            ]}
          >
            {!isSample && artworkUri ? (
              <Image source={{ uri: artworkUri }} style={styles.artworkImg} resizeMode="contain" />
            ) : (
              <View style={[styles.artworkSample, { backgroundColor: sampleColor }]} />
            )}
          </View>
        </View>

        <View style={styles.noteBanner}>
          <Text style={styles.noteText}>
            Add expo-view-shot to export the composite as a single image file.
          </Text>
        </View>

        <PrimaryButton label="Save to Library" onPress={handleSaveToLibrary} />
        <PrimaryButton label="Share" onPress={handleShare} variant="secondary" />
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
  previewBox: {
    width: '100%',
    height: PREVIEW_HEIGHT,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceMuted,
    position: 'relative',
    marginBottom: Spacing.md,
  },
  roomImg: { width: '100%', height: '100%' },
  roomPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surfaceMuted,
  },
  artworkOverlay: {
    position: 'absolute',
    top: '25%',
    left: '25%',
    width: 100,
    height: 75,
    borderWidth: 4,
    borderColor: '#E8E4DC',
  },
  artworkImg: { width: '100%', height: '100%' },
  artworkSample: {
    width: '100%',
    height: '100%',
  },
  noteBanner: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  noteText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
