import { RefObject } from 'react';
import { captureRef } from 'react-native-view-shot';

type CaptureOptions = {
  format?: 'png' | 'jpeg';
  quality?: number;
};

/** Native: capture via react-native-view-shot. */
export async function captureViewToDataUri(
  viewRef: RefObject<unknown>,
  options: CaptureOptions = {}
): Promise<string> {
  return captureRef(viewRef, {
    format: options.format === 'jpeg' ? 'jpg' : 'png',
    quality: options.quality ?? 1,
    result: 'tmpfile',
  });
}
