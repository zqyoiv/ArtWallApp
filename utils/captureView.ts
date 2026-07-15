import { RefObject } from 'react';
import { captureRef } from 'react-native-view-shot';

type CaptureOptions = {
  format?: 'png' | 'jpeg';
  quality?: number;
  /** Longest edge in pixels. Default 1920 (HD). */
  minLongEdge?: number;
};

const DEFAULT_MIN_LONG_EDGE = 1920;

/** Native: capture via react-native-view-shot at ≥ HD size. */
export async function captureViewToDataUri(
  viewRef: RefObject<unknown>,
  options: CaptureOptions = {}
): Promise<string> {
  const minLongEdge = options.minLongEdge ?? DEFAULT_MIN_LONG_EDGE;
  return captureRef(viewRef, {
    format: options.format === 'jpeg' ? 'jpg' : 'png',
    quality: options.quality ?? 1,
    result: 'tmpfile',
    // view-shot scales the snapshot to this width while keeping aspect ratio
    width: minLongEdge,
  });
}
