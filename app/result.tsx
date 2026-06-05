// app/result.tsx
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  ScrollView,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import { Colors, Spacing, Radius, Typography } from '../constants/theme';
import { useAppStore } from '../utils/store';

const { width } = Dimensions.get('window');

export default function ResultScreen() {
  const router = useRouter();
  const { cleanedRoomUri, artworkUri, placement, reset } = useAppStore();

  const handleSaveToLibrary = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Photo library write access is required to save.');
      return;
    }
    try {
      // In production, use expo-view-shot to capture the composite view as a file URI
      // then: await MediaLibrary.saveToLibraryAsync(capturedUri);
      Alert.alert(
        'Saved! (Demo)',
        'In the full version, the composite image would be saved to your Camera Roll. ' +
          'Integrate expo-view-shot to capture the canvas as a real image.',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleShare = async () => {
    try {
      // In production: share the captured composite URI
      await Share.share({
        message: 'Check out how this artwork looks on my wall! Preview made with ArtWall app.',
        title: 'My Artwork Preview',
      });
    } catch {
      // user cancelled
    }
  };

  const handleStartOver = () => {
    reset();
    router.dismissAll();
  };

  const isSample = artworkUri?.startsWith('sample:');

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Preview composite */}
        <View style={styles.previewBox}>
          {cleanedRoomUri ? (
            <Image
              source={{ uri: cleanedRoomUri }}
              style={styles.roomImg}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.roomPlaceholder} />
          )}

          {/* Artwork overlay at saved placement */}
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
              <View style={styles.artworkSample} />
            )}
          </View>
        </View>

        {/* Note about full save */}
        <View style={styles.noteBanner}>
          <Text style={styles.noteText}>
            💡 Add <Text style={styles.noteCode}>expo-view-shot</Text> to capture the real composite
            image. This screen shows a positional approximation of your placement.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleSaveToLibrary}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>💾 Save to Library</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleShare} activeOpacity={0.8}>
            <Text style={styles.secondaryBtnText}>↗ Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ghostBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.ghostBtnText}>← Adjust Placement</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ghostBtn} onPress={handleStartOver} activeOpacity={0.8}>
            <Text style={styles.ghostBtnText}>Start Over</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  previewBox: {
    width: '100%',
    height: width * 0.75,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.border,
    position: 'relative',
  },
  roomImg: { width: '100%', height: '100%' },
  roomPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#D8D0C8',
  },
  artworkOverlay: {
    position: 'absolute',
    top: '25%',
    left: '25%',
    width: 100,
    height: 75,
    borderWidth: 5,
    borderColor: '#D4C5A9',
  },
  artworkImg: { width: '100%', height: '100%' },
  artworkSample: {
    width: '100%',
    height: '100%',
    backgroundColor: '#4A6FA5',
  },
  noteBanner: {
    backgroundColor: '#EEF4FF',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#C7D9F8',
  },
  noteText: {
    fontSize: Typography.sizes.sm,
    color: '#3A5FA0',
    lineHeight: 20,
  },
  noteCode: {
    fontFamily: 'Courier',
    fontWeight: '700',
  },
  actions: {
    gap: Spacing.sm,
  },
  primaryBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: Typography.sizes.base,
  },
  secondaryBtn: {
    backgroundColor: Colors.accentWarm,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: Typography.sizes.base,
  },
  ghostBtn: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ghostBtnText: {
    color: Colors.text,
    fontWeight: '500',
    fontSize: Typography.sizes.base,
  },
});
