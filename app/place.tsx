// app/place.tsx
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
  ARTWORK_BASE_WIDTH,
  PLACEMENT_ANCHOR_LEFT,
  PLACEMENT_ANCHOR_TOP,
} from '../constants/placement';
import { ALL_SAMPLE_ARTWORKS } from '../constants/artworks';
import { useAppStore, ArtworkPlacement } from '../utils/store';
import { getImageDimensions } from '../utils/imageUtils';
import {
  DEFAULT_WALL_ESTIMATE,
  formatInchesSize,
} from '../utils/dimensions';
import { trueScaleArtworkSize } from '../utils/placementLayout';
import {
  ROOM_PREVIEW_WIDTH,
  roomPreviewHeightForAspect,
  useImageAspectRatio,
} from '../utils/useImageAspectRatio';

const CANVAS_WIDTH = ROOM_PREVIEW_WIDTH;
const DEFAULT_ARTWORK_ASPECT = 4 / 3;

const SAMPLE_COLORS = Object.fromEntries(
  ALL_SAMPLE_ARTWORKS.map((a) => [a.id, a.color])
);

function parseDimensionsAspect(dimensions: string): number | null {
  const match = dimensions.match(/(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)/i);
  if (!match) return null;
  const w = Number(match[1]);
  const h = Number(match[2]);
  if (!w || !h) return null;
  return w / h;
}

export default function PlaceScreen() {
  const router = useRouter();
  const {
    cleanedRoomUri,
    artworkUri,
    artworkSizeInches,
    wallEstimate,
    roomName,
    setPlacement,
    setFinalImageUri,
  } = useAppStore();

  const wall = wallEstimate ?? DEFAULT_WALL_ESTIMATE;
  const roomAspectRatio = useImageAspectRatio(cleanedRoomUri);
  const canvasHeight = roomPreviewHeightForAspect(roomAspectRatio);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedRotation = useSharedValue(0);

  const [artworkAspectRatio, setArtworkAspectRatio] = useState(DEFAULT_ARTWORK_ASPECT);

  const trueScaleSize = useMemo(() => {
    if (!artworkSizeInches) return null;
    return trueScaleArtworkSize(artworkSizeInches, wall, CANVAS_WIDTH);
  }, [artworkSizeInches, wall]);

  const baseArtworkWidth = trueScaleSize?.width ?? ARTWORK_BASE_WIDTH;
  const artworkHeight =
    trueScaleSize?.height ?? baseArtworkWidth / artworkAspectRatio;

  const savePlacement = () => {
    setPlacement({
      x: translateX.value,
      y: translateY.value,
      scale: scale.value,
      rotation: rotation.value,
    });
  };

  const applyPlacement = (placement: ArtworkPlacement) => {
    translateX.value = placement.x;
    translateY.value = placement.y;
    scale.value = placement.scale;
    rotation.value = placement.rotation;
    savedX.value = placement.x;
    savedY.value = placement.y;
    savedScale.value = placement.scale;
    savedRotation.value = placement.rotation;
    setPlacement(placement);
  };

  const drag = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedX.value + e.translationX;
      translateY.value = savedY.value + e.translationY;
    })
    .onEnd(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
      runOnJS(savePlacement)();
    });

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(0.2, Math.min(4, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      runOnJS(savePlacement)();
    });

  const rotate = Gesture.Rotation()
    .onUpdate((e) => {
      rotation.value = savedRotation.value + e.rotation;
    })
    .onEnd(() => {
      savedRotation.value = rotation.value;
      runOnJS(savePlacement)();
    });

  const combined = Gesture.Simultaneous(drag, pinch, rotate);

  const artworkStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}rad` },
    ],
  }));

  const resetPlacement = () => {
    applyPlacement({ x: 0, y: 0, scale: 1, rotation: 0 });
  };

  const isSample = artworkUri?.startsWith('sample:');
  const sampleId = isSample ? artworkUri?.split(':')[1] : null;
  const sampleArtwork = sampleId
    ? ALL_SAMPLE_ARTWORKS.find((item) => item.id === sampleId)
    : null;
  const sampleColor = sampleId ? SAMPLE_COLORS[sampleId] ?? '#888' : '#888';
  const backgroundUri = cleanedRoomUri || undefined;
  const previewRef = useRef<View>(null);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAspectRatio() {
      if (artworkSizeInches) {
        setArtworkAspectRatio(artworkSizeInches.widthInches / artworkSizeInches.heightInches);
        return;
      }

      if (!artworkUri) {
        setArtworkAspectRatio(DEFAULT_ARTWORK_ASPECT);
        return;
      }

      if (isSample && sampleArtwork) {
        const parsed = parseDimensionsAspect(sampleArtwork.dimensions);
        if (!cancelled) {
          setArtworkAspectRatio(parsed ?? DEFAULT_ARTWORK_ASPECT);
        }
        return;
      }

      try {
        const { width: imageWidth, height: imageHeight } = await getImageDimensions(artworkUri);
        if (!cancelled && imageWidth > 0 && imageHeight > 0) {
          setArtworkAspectRatio(imageWidth / imageHeight);
        }
      } catch {
        if (!cancelled) {
          setArtworkAspectRatio(DEFAULT_ARTWORK_ASPECT);
        }
      }
    }

    loadAspectRatio();
    return () => {
      cancelled = true;
    };
  }, [artworkUri, artworkSizeInches, isSample, sampleArtwork]);

  const handleSavePreview = async () => {
    if (!previewRef.current) return;
    setCapturing(true);
    try {
      savePlacement();
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
            {artworkSizeInches
              ? `True scale · Art ${formatInchesSize(artworkSizeInches)} on wall ~${formatInchesSize(wall)}`
              : 'Drag · Pinch to resize · Two-finger rotate'}
          </Text>
        </View>

        <View
          ref={previewRef}
          collapsable={false}
          style={[styles.canvasWrapper, { height: canvasHeight }]}
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

          <GestureDetector gesture={combined}>
            <View
              style={[
                styles.artworkAnchor,
                {
                  width: baseArtworkWidth,
                  height: artworkHeight,
                },
              ]}
            >
              <Animated.View style={[styles.artworkInner, artworkStyle]}>
                {isSample ? (
                  <View style={[styles.artworkShadowBox, { backgroundColor: sampleColor }]} />
                ) : artworkUri ? (
                  <View style={styles.artworkShadowBox}>
                    <Image
                      source={{ uri: artworkUri }}
                      style={styles.artworkImage}
                      resizeMode="cover"
                    />
                  </View>
                ) : null}
              </Animated.View>
            </View>
          </GestureDetector>
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
              disabled={capturing}
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
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  canvasWrapper: {
    width: '100%',
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
  artworkAnchor: {
    position: 'absolute',
    top: `${PLACEMENT_ANCHOR_TOP * 100}%`,
    left: `${PLACEMENT_ANCHOR_LEFT * 100}%`,
  },
  artworkInner: {
    width: '100%',
    height: '100%',
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
