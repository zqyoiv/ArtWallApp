import { RefObject } from 'react';
import html2canvas from 'html2canvas';

type CaptureOptions = {
  format?: 'png' | 'jpeg';
  quality?: number;
  /** Longest edge in pixels. Default 1920 (HD). */
  minLongEdge?: number;
};

/** Cap to avoid OOM on large phones; 1920+ still qualifies as HD. */
const MAX_SCALE = 8;
const DEFAULT_MIN_LONG_EDGE = 1920;

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

function hdScaleForElement(element: HTMLElement, minLongEdge: number): number {
  const rect = element.getBoundingClientRect();
  const cssW = Math.max(1, rect.width || element.offsetWidth || 1);
  const cssH = Math.max(1, rect.height || element.offsetHeight || 1);
  const longEdge = Math.max(cssW, cssH);
  const scaleForHd = minLongEdge / longEdge;
  const dpr =
    typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  return Math.min(MAX_SCALE, Math.max(scaleForHd, dpr, 2));
}

/**
 * Web capture at ≥ HD resolution (default 1920px on the long edge).
 * Screen preview is small on phones; we upscale the rasterize scale accordingly.
 */
export async function captureViewToDataUri(
  viewRef: RefObject<unknown>,
  options: CaptureOptions = {}
): Promise<string> {
  const element = resolveElement(viewRef.current ?? viewRef);
  const minLongEdge = options.minLongEdge ?? DEFAULT_MIN_LONG_EDGE;
  const scale = hdScaleForElement(element, minLongEdge);

  const canvas = await html2canvas(element, {
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    scale,
    imageTimeout: 15000,
  });

  const mime = options.format === 'jpeg' ? 'image/jpeg' : 'image/png';
  return canvas.toDataURL(mime, options.quality ?? 1);
}
