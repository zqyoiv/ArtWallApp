import { useEffect, useState } from 'react';
import { Dimensions, ScaledSize } from 'react-native';
import { getImageDimensions } from './imageUtils';
import { Spacing } from '../constants/theme';
import { CANVAS_ASPECT_RATIO } from '../constants/placement';

function getWindow(): ScaledSize {
  return Dimensions.get('window');
}

/** Live window size — module-level Dimensions is unreliable on mobile web. */
export function useWindowSize(): ScaledSize {
  const [size, setSize] = useState(getWindow);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setSize(window);
    });
    setSize(getWindow());
    return () => subscription.remove();
  }, []);

  return size;
}

export function useRoomPreviewMaxWidth(): number {
  const { width } = useWindowSize();
  return Math.max(0, width - Spacing.lg * 2);
}

/**
 * Fit a room photo inside maxWidth × maxHeight without cropping.
 * Shrinks width and height together so the canvas matches the image aspect —
 * critical for true-to-scale artwork placement.
 */
export function fitRoomPreviewSize(
  aspectRatio: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const ratio = aspectRatio > 0 ? aspectRatio : CANVAS_ASPECT_RATIO;
  let width = Math.max(1, maxWidth);
  let height = width / ratio;

  if (height > maxHeight && maxHeight > 0) {
    height = maxHeight;
    width = height * ratio;
  }

  return { width, height };
}

export function useRoomPreviewLayout(imageUri: string | null | undefined): {
  width: number;
  height: number;
  aspectRatio: number;
} {
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const maxWidth = Math.max(0, windowWidth - Spacing.lg * 2);
  const maxHeight = windowHeight * 0.48;
  const aspectRatio = useImageAspectRatio(imageUri);
  const size = fitRoomPreviewSize(aspectRatio, maxWidth, maxHeight);
  return { ...size, aspectRatio };
}

/**
 * Loads an image's width/height aspect ratio (width ÷ height).
 * Falls back to 16:9 until loaded or on error.
 */
export function useImageAspectRatio(uri: string | null | undefined): number {
  const [aspectRatio, setAspectRatio] = useState(CANVAS_ASPECT_RATIO);

  useEffect(() => {
    let cancelled = false;

    if (!uri) {
      setAspectRatio(CANVAS_ASPECT_RATIO);
      return;
    }

    getImageDimensions(uri)
      .then(({ width, height }) => {
        if (!cancelled && width > 0 && height > 0) {
          setAspectRatio(width / height);
        }
      })
      .catch(() => {
        if (!cancelled) setAspectRatio(CANVAS_ASPECT_RATIO);
      });

    return () => {
      cancelled = true;
    };
  }, [uri]);

  return aspectRatio;
}

/** @deprecated Prefer useRoomPreviewLayout / useRoomPreviewMaxWidth — static at import time. */
export const ROOM_PREVIEW_WIDTH = getWindow().width - Spacing.lg * 2;

/** @deprecated Prefer fitRoomPreviewSize / useRoomPreviewLayout. */
export function roomPreviewHeightForAspect(
  aspectRatio: number,
  width = ROOM_PREVIEW_WIDTH
): number {
  return fitRoomPreviewSize(aspectRatio, width, Number.POSITIVE_INFINITY).height;
}
