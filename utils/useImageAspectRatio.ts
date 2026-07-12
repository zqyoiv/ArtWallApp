import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import { getImageDimensions } from './imageUtils';
import { Spacing } from '../constants/theme';
import { CANVAS_ASPECT_RATIO } from '../constants/placement';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ROOM_PREVIEW_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;
/** Cap so tall photos don't push all controls off-screen. */
const MAX_ROOM_PREVIEW_HEIGHT = SCREEN_HEIGHT * 0.48;

export function roomPreviewHeightForAspect(aspectRatio: number, width = ROOM_PREVIEW_WIDTH): number {
  const naturalHeight = width / aspectRatio;
  return Math.min(naturalHeight, MAX_ROOM_PREVIEW_HEIGHT);
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
