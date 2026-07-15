// app/artwork.tsx — main screen after AI cleanup
import { useCallback, useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../components/ScreenHeader';
import { RoomPreview } from '../components/RoomPreview';
import { SectionHeader } from '../components/SectionHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { Colors, Radius, Shadow, Spacing, Typography } from '../constants/theme';
import { GALLERY_ARTWORKS, type GalleryArtwork } from '../constants/gallery';
import { useAppStore, type SelectedArtwork } from '../utils/store';
import {
  DEFAULT_WALL_ESTIMATE,
  parseArtworkInchesSize,
} from '../utils/dimensions';
import {
  layoutArtworksNonOverlapping,
  trueScaleArtworkSize,
} from '../utils/placementLayout';
import { useRoomPreviewLayout } from '../utils/useImageAspectRatio';
import { resolveAssetUri } from '../utils/imageUtils';

export default function ArtworkScreen() {
  const router = useRouter();
  const {
    cleanedRoomUri,
    roomName,
    wallEstimate,
    selectedArtworks,
    setSelectedArtworks,
  } = useAppStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [designing, setDesigning] = useState(false);

  const { width: canvasWidth, height: canvasHeight } = useRoomPreviewLayout(cleanedRoomUri);
  const wall = wallEstimate ?? DEFAULT_WALL_ESTIMATE;

  useFocusEffect(
    useCallback(() => {
      setSelectedIds(selectedArtworks.map((item) => item.id));
    }, [selectedArtworks])
  );

  const toggleArtwork = (artwork: GalleryArtwork) => {
    setSelectedIds((prev) =>
      prev.includes(artwork.id)
        ? prev.filter((id) => id !== artwork.id)
        : [...prev, artwork.id]
    );
  };

  const selectedCount = selectedIds.length;

  const handleDesign = async () => {
    if (designing) return;
    setDesigning(true);
    try {
      const ordered = GALLERY_ARTWORKS.filter((item) => selectedIds.includes(item.id));
      const prepared: Array<{
        artwork: GalleryArtwork;
        sizeInches: NonNullable<ReturnType<typeof parseArtworkInchesSize>>;
        uri: string | null;
      }> = [];

      for (const artwork of ordered) {
        const sizeInches = parseArtworkInchesSize(artwork.dimensionsIn);
        if (!sizeInches) continue;
        const uri = await resolveAssetUri(artwork.image);
        prepared.push({ artwork, sizeInches, uri });
      }

      if (prepared.length === 0) return;

      const sizes = prepared.map(({ sizeInches }) =>
        trueScaleArtworkSize(sizeInches, wall, canvasWidth)
      );
      const placements = layoutArtworksNonOverlapping(
        sizes,
        canvasWidth,
        canvasHeight,
        wall
      );

      const next: SelectedArtwork[] = prepared.map((item, index) => ({
        id: item.artwork.id,
        image: item.artwork.image,
        uri: item.uri,
        title: item.artwork.title,
        sizeInches: item.sizeInches,
        placement: placements[index] ?? { x: 0, y: 0, scale: 1, rotation: 0 },
      }));

      setSelectedArtworks(next);
      router.push('/place');
    } finally {
      setDesigning(false);
    }
  };

  const selectedLabel = useMemo(() => {
    if (selectedCount === 0) return 'Select artworks to design your wall';
    if (selectedCount === 1) return '1 artwork selected';
    return `${selectedCount} artworks selected`;
  }, [selectedCount]);

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
          <Text style={styles.hint}>{selectedLabel}</Text>
          <View style={styles.grid}>
            {GALLERY_ARTWORKS.map((artwork) => {
              const selected = selectedIds.includes(artwork.id);
              return (
                <TouchableOpacity
                  key={artwork.id}
                  style={styles.card}
                  onPress={() => toggleArtwork(artwork)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.frame, selected && styles.frameSelected]}>
                    <Image source={artwork.image} style={styles.thumb} resizeMode="cover" />
                    {selected ? (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.meta}>
                    <Text style={styles.title} numberOfLines={2}>
                      {artwork.title}
                    </Text>
                    <Text style={styles.dims}>{artwork.dimensionsIn}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="Design"
          onPress={handleDesign}
          loading={designing}
          disabled={selectedCount === 0 || designing}
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
  hint: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
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
  frameSelected: {
    borderColor: Colors.accent,
    borderWidth: 2,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
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
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
});
