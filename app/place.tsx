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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { Colors, Spacing, Radius, Typography } from '../constants/theme';
import { useAppStore } from '../utils/store';

const { width } = Dimensions.get('window');
const CANVAS_HEIGHT = width * (9 / 16); // match 16:9 cleaned room image
const ARTWORK_SIZE = 120; // initial size

// Sample colors for demo artworks
const SAMPLE_COLORS: Record<string, string> = {
  '1': '#4A6FA5',
  '2': '#C4856A',
  '3': '#2D6A4F',
  '4': '#1A1A1A',
};

export default function PlaceScreen() {
  const router = useRouter();
  const { cleanedRoomUri, artworkUri, setPlacement, setFinalImageUri } = useAppStore();

  // Gesture shared values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  // Track accumulated values for compound gestures
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

  // Drag gesture
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

  // Pinch gesture
  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(0.2, Math.min(4, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      runOnJS(savePlacement)();
    });

  // Rotate gesture
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

  const handleSavePreview = () => {
    savePlacement();
    // In production: use ViewShot or expo-gl to capture the composite
    // For MVP, we'll just pass the URIs and placement to result screen
    setFinalImageUri(cleanedRoomUri); // placeholder — result screen renders composite
    router.push('/result');
  };

  const isSample = artworkUri?.startsWith('sample:');
  const sampleId = isSample ? artworkUri?.split(':')[1] : null;
  const sampleColor = sampleId ? SAMPLE_COLORS[sampleId] : '#888';

  const backgroundUri = cleanedRoomUri || undefined;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        {/* Instruction */}
        <View style={styles.instructionBar}>
          <Text style={styles.instructionText}>
            Drag · Pinch to resize · Two-finger rotate
          </Text>
        </View>

        {/* Canvas */}
        <View style={styles.canvasWrapper}>
          {/* Background room */}
          {backgroundUri ? (
            <Image source={{ uri: backgroundUri }} style={styles.canvas} resizeMode="cover" />
          ) : (
            <View style={[styles.canvas, styles.canvasPlaceholder]}>
              <Text style={styles.canvasPlaceholderText}>Room preview</Text>
            </View>
          )}

          {/* Artwork overlay */}
          <GestureDetector gesture={combined}>
            <Animated.View style={[styles.artworkWrapper, artworkStyle]}>
              {isSample ? (
                <View style={[styles.sampleArtwork, { backgroundColor: sampleColor }]}>
                  <View style={styles.artworkFrame} />
                </View>
              ) : artworkUri ? (
                <View style={styles.artworkImageWrapper}>
                  <View style={styles.artworkFrame} />
                  <Image
                    source={{ uri: artworkUri }}
                    style={styles.artworkImage}
                    resizeMode="contain"
                  />
                </View>
              ) : null}
            </Animated.View>
          </GestureDetector>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.resetBtn} onPress={resetPlacement} activeOpacity={0.8}>
            <Text style={styles.resetBtnText}>↺ Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSavePreview}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>Save Preview →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, gap: Spacing.md, padding: Spacing.md },
  instructionBar: {
    backgroundColor: Colors.surfaceWarm,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  instructionText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  canvasWrapper: {
    flex: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.border,
    position: 'relative',
  },
  canvas: {
    width: '100%',
    height: '100%',
  },
  canvasPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D8D0C8',
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
  sampleArtwork: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
    padding: 8,
  },
  artworkFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 6,
    borderColor: '#D4C5A9',
    borderRadius: 2,
    zIndex: 2,
  },
  artworkImageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  artworkImage: {
    width: '100%',
    height: '100%',
  },
  controls: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  resetBtn: {
    flex: 0,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  resetBtnText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: Typography.sizes.base,
  },
});
