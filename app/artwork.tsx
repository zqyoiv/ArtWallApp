// app/artwork.tsx — main screen after AI cleanup
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../components/ScreenHeader';
import { RoomPreview } from '../components/RoomPreview';
import { SectionHeader } from '../components/SectionHeader';
import { Colors, Radius, Shadow, Spacing, Typography } from '../constants/theme';
import { GALLERY_ARTWORKS, type GalleryArtwork } from '../constants/gallery';
import { useAppStore } from '../utils/store';
import { parseArtworkInchesSize } from '../utils/dimensions';

export default function ArtworkScreen() {
  const router = useRouter();
  const { cleanedRoomUri, roomName, setArtworkUri, setArtworkSizeInches } = useAppStore();

  const selectArtwork = (artwork: GalleryArtwork) => {
    const resolved = Image.resolveAssetSource(artwork.image);
    if (!resolved?.uri) return;
    setArtworkUri(resolved.uri);
    setArtworkSizeInches(parseArtworkInchesSize(artwork.dimensionsIn));
    router.push('/place');
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={roomName}
        onBackPress={() => router.dismissTo('/capture')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <RoomPreview imageUri={cleanedRoomUri} showPlacementZone={false} />

        <View style={styles.addArtSection}>
          <SectionHeader title="Add Art" />
          <View style={styles.grid}>
            {GALLERY_ARTWORKS.map((artwork) => (
              <TouchableOpacity
                key={artwork.id}
                style={styles.card}
                onPress={() => selectArtwork(artwork)}
                activeOpacity={0.85}
              >
                <View style={styles.frame}>
                  <Image source={artwork.image} style={styles.thumb} resizeMode="cover" />
                </View>
                <View style={styles.meta}>
                  <Text style={styles.title} numberOfLines={2}>
                    {artwork.title}
                  </Text>
                  <Text style={styles.dims}>{artwork.dimensionsIn}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
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
  content: {
    paddingBottom: Spacing['2xl'],
  },
  addArtSection: {
    backgroundColor: Colors.surfaceMuted,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    marginTop: Spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.xl,
  },
  card: {
    width: '48%',
  },
  frame: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    ...Shadow.card,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  meta: {
    marginTop: Spacing.sm,
    gap: 2,
  },
  title: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  dims: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
});
