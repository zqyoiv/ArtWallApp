import { RefObject } from 'react';
import html2canvas from 'html2canvas';

type CaptureOptions = {
  format?: 'png' | 'jpeg';
  quality?: number;
};

function resolveElement(view: unknown): HTMLElement {
  if (!view) {
    throw new Error('Nothing to capture');
  }
  if (typeof HTMLElement !== 'undefined' && view instanceof HTMLElement) {
    return view;
  }
  if (typeof view === 'object' && view !== null && 'current' in view) {
    return resolveElement((view as { current: unknown }).current);
  }

  const anyView = view as {
    getNode?: () => unknown;
    _nativeNode?: unknown;
    hostNode?: unknown;
  };

  if (typeof anyView.getNode === 'function') {
    return resolveElement(anyView.getNode());
  }
  if (anyView._nativeNode) {
    return resolveElement(anyView._nativeNode);
  }
  if (anyView.hostNode) {
    return resolveElement(anyView.hostNode);
  }

  throw new Error('Could not resolve a DOM node to capture on web');
}

/**
 * Web capture without findNodeHandle (unsupported on react-native-web).
 * Uses html2canvas on the View's underlying DOM element.
 */
export async function captureViewToDataUri(
  viewRef: RefObject<unknown>,
  options: CaptureOptions = {}
): Promise<string> {
  const element = resolveElement(viewRef.current ?? viewRef);
  const canvas = await html2canvas(element, {
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    scale: Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1),
  });
  const mime = options.format === 'jpeg' ? 'image/jpeg' : 'image/png';
  return canvas.toDataURL(mime, options.quality ?? 1);
}
