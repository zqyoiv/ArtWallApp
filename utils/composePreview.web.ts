import type { ImageSourcePropType } from 'react-native';
import { resolveAssetUri } from './imageUtils';
import { trueScaleArtworkSize } from './placementLayout';
import type { ComposePreviewInput } from './composePreview';

const MAX_LONG_EDGE = 4096;

export type ComposePreviewResult = {
  /** Object URL or data URL suitable for in-app preview / result screen. */
  uri: string;
  file: File;
  width: number;
  height: number;
};

type DrawableBitmap = ImageBitmap | HTMLImageElement;

function bitmapSize(img: DrawableBitmap): { width: number; height: number } {
  if (typeof ImageBitmap !== 'undefined' && img instanceof ImageBitmap) {
    return { width: img.width, height: img.height };
  }
  const el = img as HTMLImageElement;
  return { width: el.naturalWidth, height: el.naturalHeight };
}

function closeBitmap(img: DrawableBitmap) {
  if (typeof ImageBitmap !== 'undefined' && img instanceof ImageBitmap) {
    img.close();
  }
}

/**
 * Load full-resolution pixels via fetch + createImageBitmap.
 * Avoids `new Image()` + crossOrigin, which on iOS Safari can reuse the
 * downscaled decode of the same URI already shown small in the on-screen preview —
 * that makes the room look sharp in-app but pixelated in the saved file.
 */
async function loadBitmap(uri: string): Promise<DrawableBitmap> {
  // data: and blob: — fetch the bytes directly (no CORS / display-cache issues).
  if (uri.startsWith('data:') || uri.startsWith('blob:')) {
    const response = await fetch(uri);
    const blob = await response.blob();
    if (typeof createImageBitmap === 'function') {
      return createImageBitmap(blob);
    }
  } else {
    try {
      const response = await fetch(uri, { mode: 'cors', credentials: 'omit' });
      if (response.ok) {
        const blob = await response.blob();
        if (typeof createImageBitmap === 'function') {
          return createImageBitmap(blob);
        }
      }
    } catch {
      // Fall through to HTMLImageElement.
    }
  }

  return loadHtmlImage(uri);
}

function loadHtmlImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const HtmlImage = window.Image;
    const img = new HtmlImage();
    // Only set CORS for http(s) remote URLs — blob/data break with crossOrigin on some browsers.
    if (/^https?:\/\//i.test(uri)) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        resolve(img);
      } else {
        reject(new Error('Image loaded with empty dimensions'));
      }
    };
    img.onerror = () => reject(new Error(`Could not load image: ${uri.slice(0, 80)}`));
    img.src = uri;
  });
}

async function resolveDrawableUri(
  image: ImageSourcePropType,
  uri?: string | null
): Promise<string> {
  if (uri) return uri;
  const resolved = await resolveAssetUri(image);
  if (!resolved) {
    throw new Error('Could not resolve artwork image');
  }
  return resolved;
}

function canvasToPngFile(canvas: HTMLCanvasElement): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not encode preview image'));
          return;
        }
        resolve(
          new File([blob], `artwall-preview-${Date.now()}.png`, {
            type: 'image/png',
            lastModified: Date.now(),
          })
        );
      },
      'image/png'
    );
  });
}

/**
 * Composite the cleaned room + placed artworks at the room photo's native resolution
 * (capped at 4096 on the long edge). Uses createImageBitmap so we never inherit the
 * low-res decode used for the on-screen preview.
 */
export async function composePreviewImage(
  input: ComposePreviewInput
): Promise<ComposePreviewResult> {
  if (typeof document === 'undefined') {
    throw new Error('composePreviewImage requires a browser');
  }
  if (input.canvasWidth < 1 || input.canvasHeight < 1) {
    throw new Error('Invalid canvas size for compose');
  }

  const roomImg = await loadBitmap(input.roomUri);
  const roomSize = bitmapSize(roomImg);
  let outW = roomSize.width;
  let outH = roomSize.height;

  // If caller provides a higher-res original, export at that size (upscale cleaned room).
  if (
    input.targetWidth &&
    input.targetHeight &&
    input.targetWidth * input.targetHeight > outW * outH
  ) {
    outW = input.targetWidth;
    outH = input.targetHeight;
  }

  const longEdge = Math.max(outW, outH);
  if (longEdge > MAX_LONG_EDGE) {
    const shrink = MAX_LONG_EDGE / longEdge;
    outW = Math.round(outW * shrink);
    outH = Math.round(outH * shrink);
  }

  const scaleX = outW / input.canvasWidth;
  const scaleY = outH / input.canvasHeight;

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    closeBitmap(roomImg);
    throw new Error('Could not create canvas context');
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outW, outH);

  const roomNative = bitmapSize(roomImg);
  const roomIs1to1 = roomNative.width === outW && roomNative.height === outH;
  ctx.imageSmoothingEnabled = !roomIs1to1;
  if (!roomIs1to1) {
    ctx.imageSmoothingQuality = 'high';
  }
  ctx.drawImage(roomImg, 0, 0, outW, outH);
  closeBitmap(roomImg);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  for (const artwork of input.artworks) {
    const drawableUri = await resolveDrawableUri(artwork.image, artwork.uri);
    const artImg = await loadBitmap(drawableUri);
    const displaySize = trueScaleArtworkSize(
      artwork.sizeInches,
      input.wall,
      input.canvasWidth
    );
    const w = Math.max(1, displaySize.width * scaleX);
    const h = Math.max(1, displaySize.height * scaleY);
    const x = artwork.placement.x * scaleX;
    const y = artwork.placement.y * scaleY;

    ctx.save();
    const shadowScale = (scaleX + scaleY) / 2;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.38)';
    ctx.shadowBlur = 14 * shadowScale;
    ctx.shadowOffsetX = 10 * shadowScale;
    ctx.shadowOffsetY = 10 * shadowScale;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, w, h);
    ctx.restore();

    ctx.drawImage(artImg, x, y, w, h);
    closeBitmap(artImg);
  }

  const file = await canvasToPngFile(canvas);
  const uri = URL.createObjectURL(file);
  return { uri, file, width: outW, height: outH };
}

/** @deprecated Prefer composePreviewImage (returns File without huge base64). */
export async function composePreviewDataUri(input: ComposePreviewInput): Promise<string> {
  const result = await composePreviewImage(input);
  return result.uri;
}
