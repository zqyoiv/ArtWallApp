// app/place.tsx — arrange one or more artworks on the cleaned room wall
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { captureRef } from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';
import {
  useAppStore,
  type ArtworkPlacement,
  type SelectedArtwork,
} from '../utils/store';
import {
  DEFAULT_WALL_ESTIMATE,
  formatInchesSize,
} from '../utils/dimensions';
import {
  layoutArtworksNonOverlapping,
  trueScaleArtworkSize,
} from '../utils/placementLayout';
import { useRoomPreviewLayout } from '../utils/useImageAspectRatio';

const TRASH_SIZE = 44;
const TRASH_PADDING = 10;
/** Hit area around the trash icon for delete-on-drop. */
const TRASH_HIT_RADIUS = 56;

function isOverTrashZone(
  left: number,
  top: number,
  width: number,
  height: number,
  scale: number,
  canvasHeight: number
): boolean {
  const scaledW = width * scale;
  const scaledH = height * scale;
  const centerX = left + scaledW / 2;
  const centerY = top + scaledH / 2;
  const trashCenterX = TRASH_PADDING + TRASH_SIZE / 2;
  const trashCenterY = canvasHeight - TRASH_PADDING - TRASH_SIZE / 2;
  return Math.hypot(centerX - trashCenterX, centerY - trashCenterY) <= TRASH_HIT_RADIUS;
}

type PlaceableProps = {
  artwork: SelectedArtwork;
  width: number;
  height: number;
  canvasHeight: number;
  zIndex: number;
  onActivate: () => void;
  onHoverTrash: (hovering: boolean) => void;
  onPlacementChange: (placement: ArtworkPlacement) => void;
  onDelete: () => void;
};

function PlaceableArtwork({
  artwork,
  width,
  height,
  canvasHeight,
  zIndex,
  onActivate,
  onHoverTrash,
  onPlacementChange,
  onDelete,
}: PlaceableProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const finishDrag = () => {
    const nextX = artwork.placement.x + translateX.value;
    const nextY = artwork.placement.y + translateY.value;

    if (isOverTrashZone(nextX, nextY, width, height, 1, canvasHeight)) {
      onHoverTrash(false);
      onDelete();
      return;
    }

    onHoverTrash(false);
    onPlacementChange({
      x: nextX,
      y: nextY,
      scale: 1,
      rotation: 0,
    });
  };

  const reportTrashHover = (tx: number, ty: number) => {
    const hovering = isOverTrashZone(
      artwork.placement.x + tx,
      artwork.placement.y + ty,
      width,
      height,
      1,
      canvasHeight
    );
    onHoverTrash(hovering);
  };

  const drag = Gesture.Pan()
    .onBegin(() => {
      runOnJS(onActivate)();
    })
    .onUpdate((e) => {
      translateX.value = savedX.value + e.translationX;
      translateY.value = savedY.value + e.translationY;
      runOnJS(reportTrashHover)(translateX.value, translateY.value);
    })
    .onEnd(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
      runOnJS(finishDrag)();
    });

  const artworkStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={drag}>
      <Animated.View
        style={[
          styles.artworkAnchor,
          {
            left: artwork.placement.x,
            top: artwork.placement.y,
            width,
            height,
            zIndex,
          },
          artworkStyle,
        ]}
      >
        <View style={styles.artworkShadowBox}>
          <Image
            source={artwork.image ?? (artwork.uri ? { uri: artwork.uri } : undefined)}
            style={styles.artworkImage}
            resizeMode="cover"
          />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

export default function PlaceScreen() {
  const router = useRouter();
  const {
    cleanedRoomUri,
    selectedArtworks,
    setSelectedArtworks,
    updateArtworkPlacement,
    wallEstimate,
    roomName,
    setFinalImageUri,
  } = useAppStore();

  const wall = wallEstimate ?? DEFAULT_WALL_ESTIMATE;
  const { width: canvasWidth, height: canvasHeight } = useRoomPreviewLayout(cleanedRoomUri);
  const backgroundUri = cleanedRoomUri || undefined;
  const previewRef = useRef<View>(null);
  const [capturing, setCapturing] = useState(false);
  const [layoutEpoch, setLayoutEpoch] = useState(0);
  const [trashActive, setTrashActive] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(
    selectedArtworks[0]?.id ?? null
  );

  const sizedArtworks = useMemo(
    () =>
      selectedArtworks.map((artwork) => {
        const size = trueScaleArtworkSize(artwork.sizeInches, wall, canvasWidth);
        return { artwork, ...size };
      }),
    [selectedArtworks, wall, canvasWidth]
  );

  // If the fitted canvas size changes (viewport / image aspect settle), scale existing
  // placements — never re-pack, so user drag positions are preserved.
  const lastCanvasRef = useRef({ width: 0, height: 0 });
  useEffect(() => {
    if (canvasWidth < 32 || canvasHeight < 32) return;

    const prev = lastCanvasRef.current;
    lastCanvasRef.current = { width: canvasWidth, height: canvasHeight };

    if (prev.width < 32 || prev.height < 32) return;
    if (prev.width === canvasWidth && prev.height === canvasHeight) return;

    const scaleX = canvasWidth / prev.width;
    const scaleY = canvasHeight / prev.height;
    setSelectedArtworks((arts) =>
      arts.map((artwork) => ({
        ...artwork,
        placement: {
          ...artwork.placement,
          x: artwork.placement.x * scaleX,
          y: artwork.placement.y * scaleY,
        },
      }))
    );
  }, [canvasWidth, canvasHeight, setSelectedArtworks]);

  const removeArtwork = (id: string) => {
    setSelectedArtworks(selectedArtworks.filter((item) => item.id !== id));
    setActiveId((current) => (current === id ? null : current));
    setTrashActive(false);
    setLayoutEpoch((value) => value + 1);
  };

  const resetPlacement = () => {
    const sizes = sizedArtworks.map(({ width, height }) => ({ width, height }));
    const placements = layoutArtworksNonOverlapping(
      sizes,
      canvasWidth,
      canvasHeight,
      wall
    );
    setSelectedArtworks(
      selectedArtworks.map((artwork, index) => ({
        ...artwork,
        placement: placements[index] ?? { x: 0, y: 0, scale: 1, rotation: 0 },
      }))
    );
    setLayoutEpoch((value) => value + 1);
    setTrashActive(false);
  };

  const handleSavePreview = async () => {
    if (!previewRef.current) return;
    setCapturing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const uri = await captureRef(previewRef, {
        format: 'png',
        quality: 1,
      });
      setFinalImageUri(uri);
      router.push('/result');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not capture preview.';
      Alert.alert('Capture Failed', message);
    } finally {
      setCapturing(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title={roomName} />

      <View style={styles.container}>
        <View style={styles.hintBar}>
          <Text style={styles.hintText}>
            Blank wall ~{formatInchesSize(wall)}
            {wallEstimate ? '' : ' (default estimate)'}
          </Text>
          <Text style={styles.hintSubtext}>
            Drag artworks to move · Drag to the trash to remove
          </Text>
        </View>

        <View style={[styles.canvasShell, { width: canvasWidth, height: canvasHeight }]}>
          <View
            ref={previewRef}
            collapsable={false}
            style={styles.canvasWrapper}
          >
            <View style={styles.roomClip}>
              {backgroundUri ? (
                <Image source={{ uri: backgroundUri }} style={styles.canvas} resizeMode="contain" />
              ) : (
                <View style={[styles.canvas, styles.canvasPlaceholder]}>
                  <Text style={styles.canvasPlaceholderText}>Room preview</Text>
                </View>
              )}
            </View>

            {sizedArtworks.map(({ artwork, width, height }, index) => (
              <PlaceableArtwork
                key={`${artwork.id}-${layoutEpoch}-${Math.round(artwork.placement.x)}-${Math.round(artwork.placement.y)}`}
                artwork={artwork}
                width={width}
                height={height}
                canvasHeight={canvasHeight}
                zIndex={artwork.id === activeId ? 100 : index + 1}
                onActivate={() => setActiveId(artwork.id)}
                onHoverTrash={setTrashActive}
                onPlacementChange={(placement) => updateArtworkPlacement(artwork.id, placement)}
                onDelete={() => removeArtwork(artwork.id)}
              />
            ))}
          </View>

          <View
            pointerEvents="none"
            style={[styles.trashWrap, trashActive && styles.trashWrapActive]}
          >
            <Ionicons
              name="trash-outline"
              size={22}
              color={trashActive ? Colors.error : Colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.resetBtn} onPress={resetPlacement} activeOpacity={0.85}>
            <Text style={styles.resetBtnText}>Reset</Text>
          </TouchableOpacity>
          <View style={styles.saveWrap}>
            <PrimaryButton
              label="Save Preview"
              onPress={handleSavePreview}
              loading={capturing}
              disabled={capturing || selectedArtworks.length === 0}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  hintBar: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  hintText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  hintSubtext: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  canvasShell: {
    alignSelf: 'center',
    position: 'relative',
  },
  canvasWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceMuted,
    position: 'relative',
    overflow: 'hidden',
  },
  roomClip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  canvas: {
    width: '100%',
    height: '100%',
  },
  canvasPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvasPlaceholderText: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.sm,
  },
  trashWrap: {
    position: 'absolute',
    left: TRASH_PADDING,
    bottom: TRASH_PADDING,
    width: TRASH_SIZE,
    height: TRASH_SIZE,
    borderRadius: Radius.sm,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  trashWrapActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  artworkAnchor: {
    position: 'absolute',
  },
  artworkShadowBox: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 10, height: 10 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    elevation: 12,
  },
  artworkImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  controls: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  resetBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resetBtnText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  saveWrap: {
    flex: 1,
  },
});
