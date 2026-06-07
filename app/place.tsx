// app/place.tsx
import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
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
import { ALL_SAMPLE_ARTWORKS } from '../constants/artworks';
import { useAppStore } from '../utils/store';

const { width } = Dimensions.get('window');
const CANVAS_HEIGHT = (width - Spacing.lg * 2) * (9 / 16);
const ARTWORK_SIZE = 120;

const SAMPLE_COLORS = Object.fromEntries(
  ALL_SAMPLE_ARTWORKS.map((a) => [a.id, a.color])
);

export default function PlaceScreen() {
  const router = useRouter();
  const { cleanedRoomUri, artworkUri, roomName, setPlacement, setFinalImageUri } =
    useAppStore();

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedRotation = useSharedValue(0);

  const savePlacement = () => {
    setPlacement({
      x: translateX.value,
      y: translateY.value,
      scale: scale.value,
      rotation: rotation.value,
    });
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
    translateX.value = 0;
    translateY.value = 0;
    scale.value = 1;
    rotation.value = 0;
    savedX.value = 0;
    savedY.value = 0;
    savedScale.value = 1;
    savedRotation.value = 0;
  };

  const isSample = artworkUri?.startsWith('sample:');
  const sampleId = isSample ? artworkUri?.split(':')[1] : null;
  const sampleColor = sampleId ? SAMPLE_COLORS[sampleId] ?? '#888' : '#888';
  const backgroundUri = cleanedRoomUri || undefined;
  const previewRef = useRef<View>(null);
  const [capturing, setCapturing] = useState(false);

  const handleSavePreview = async () => {
    if (!previewRef.current) return;
    setCapturing(true);
    try {
      savePlacement();
      // Brief delay so transforms are committed before capture
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

          <GestureDetector gesture={combined}>
            <Animated.View style={[styles.artworkWrapper, artworkStyle]}>
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
  artworkWrapper: {
    position: 'absolute',
    top: '30%',
    left: '25%',
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE * 0.75,
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
