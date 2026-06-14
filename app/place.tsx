// app/place.tsx
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
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
import { SettingToggle } from '../components/SettingToggle';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';
import {
  ARTWORK_BASE_WIDTH,
  CANVAS_ASPECT_RATIO,
  PLACEMENT_ANCHOR_LEFT,
  PLACEMENT_ANCHOR_TOP,
} from '../constants/placement';
import { ALL_SAMPLE_ARTWORKS } from '../constants/artworks';
import { useAppStore, ArtworkPlacement } from '../utils/store';
import { suggestArtworkLayout } from '../utils/openai';
import { getOpenAIApiKey, hasOpenAIApiKey } from '../utils/config';
import { getImageDimensions } from '../utils/imageUtils';
import { artworkHeightForAspect, placementFromAiSuggestion } from '../utils/placementLayout';

const { width } = Dimensions.get('window');
const CANVAS_WIDTH = width - Spacing.lg * 2;
const CANVAS_HEIGHT = CANVAS_WIDTH / CANVAS_ASPECT_RATIO;
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
    roomName,
    aiLayoutEnabled,
    setAiLayoutEnabled,
    setPlacement,
    setFinalImageUri,
  } = useAppStore();

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedRotation = useSharedValue(0);

  const [artworkAspectRatio, setArtworkAspectRatio] = useState(DEFAULT_ARTWORK_ASPECT);
  const [aiLayoutLoading, setAiLayoutLoading] = useState(false);

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
  const artworkHeight = artworkHeightForAspect(artworkAspectRatio);

  useEffect(() => {
    let cancelled = false;

    async function loadAspectRatio() {
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
  }, [artworkUri, isSample, sampleArtwork]);

  const handleAiLayout = async () => {
    if (!backgroundUri) {
      Alert.alert('Room Missing', 'Add a cleaned room photo before using AI layout.');
      return;
    }

    if (!hasOpenAIApiKey()) {
      Alert.alert(
        'API Key Required',
        'Add EXPO_PUBLIC_OPENAI_API_KEY in .env to use AI layout suggestions.',
        [{ text: 'OK' }]
      );
      return;
    }

    setAiLayoutLoading(true);
    try {
      const suggestion = await suggestArtworkLayout({
        roomUri: backgroundUri,
        artworkUri: isSample ? null : artworkUri,
        artworkAspectRatio,
        artworkDescription: sampleArtwork
          ? `Sample artwork titled "${sampleArtwork.title}" (${sampleArtwork.dimensions}).`
          : undefined,
        apiKey: getOpenAIApiKey(),
      });

      const placement = placementFromAiSuggestion(suggestion, CANVAS_WIDTH, artworkAspectRatio);
      applyPlacement(placement);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not suggest a layout.';
      Alert.alert('AI Layout Failed', message);
    } finally {
      setAiLayoutLoading(false);
    }
  };

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
        <SettingToggle
          label="Use AI layout"
          value={aiLayoutEnabled}
          onValueChange={setAiLayoutEnabled}
          disabled={aiLayoutLoading}
        />

        {aiLayoutEnabled ? (
          <PrimaryButton
            label="Let AI Decide Layout"
            onPress={handleAiLayout}
            loading={aiLayoutLoading}
            disabled={aiLayoutLoading || capturing}
          />
        ) : null}

        <View style={styles.hintBar}>
          <Text style={styles.hintText}>Drag · Pinch to resize · Two-finger rotate</Text>
        </View>

        <View ref={previewRef} collapsable={false} style={styles.canvasWrapper}>
          <View style={styles.roomClip}>
            {backgroundUri ? (
              <Image source={{ uri: backgroundUri }} style={styles.canvas} resizeMode="cover" />
            ) : (
              <View style={[styles.canvas, styles.canvasPlaceholder]}>
                <Text style={styles.canvasPlaceholderText}>Room preview</Text>
              </View>
            )}
          </View>

          {aiLayoutLoading ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Finding the best spot…</Text>
            </View>
          ) : null}

          <GestureDetector gesture={combined}>
            <View
              style={[
                styles.artworkAnchor,
                {
                  width: ARTWORK_BASE_WIDTH,
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
              disabled={capturing || aiLayoutLoading}
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
    alignItems: 'center',
  },
  hintText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  canvasWrapper: {
    flex: 1,
    maxHeight: CANVAS_HEIGHT,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceMuted,
    position: 'relative',
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    zIndex: 2,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.sm,
    fontWeight: '500',
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
    borderRadius: 2,
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
    borderRadius: 2,
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
