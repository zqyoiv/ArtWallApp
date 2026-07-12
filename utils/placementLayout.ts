import {
  CANVAS_ASPECT_RATIO,
  PLACEMENT_ANCHOR_LEFT,
  PLACEMENT_ANCHOR_TOP,
} from '../constants/placement';
import { ArtworkPlacement } from './store';
import { artworkDisplayWidthPx, SizeInches, WallEstimate } from './dimensions';

export type AiLayoutSuggestion = {
  centerX: number;
  centerY: number;
  widthFraction: number;
  rotation: number;
};

export function artworkHeightForWidth(widthPx: number, aspectRatio: number): number {
  return widthPx / aspectRatio;
}

/** True-to-scale display size for artwork relative to the estimated blank wall. */
export function trueScaleArtworkSize(
  artwork: SizeInches,
  wall: WallEstimate,
  canvasWidth: number
): { width: number; height: number; aspectRatio: number } {
  const width = Math.max(24, artworkDisplayWidthPx(artwork, wall, canvasWidth));
  const aspectRatio = artwork.widthInches / artwork.heightInches;
  return {
    width,
    height: artworkHeightForWidth(width, aspectRatio),
    aspectRatio,
  };
}

export function trueScaleWidthFraction(
  artwork: SizeInches,
  wall: WallEstimate
): number {
  return (artwork.widthInches / wall.widthInches) * wall.regionWidthFraction;
}

export function placementFromAiSuggestion(
  suggestion: AiLayoutSuggestion,
  canvasWidth: number,
  baseArtworkWidth: number,
  aspectRatio: number
): ArtworkPlacement {
  const canvasHeight = canvasWidth / CANVAS_ASPECT_RATIO;
  const artworkHeight = artworkHeightForWidth(baseArtworkWidth, aspectRatio);

  const baseCenterX = PLACEMENT_ANCHOR_LEFT * canvasWidth + baseArtworkWidth / 2;
  const baseCenterY = PLACEMENT_ANCHOR_TOP * canvasHeight + artworkHeight / 2;

  const targetCenterX = suggestion.centerX * canvasWidth;
  const targetCenterY = suggestion.centerY * canvasHeight;
  const targetScale = Math.max(
    0.2,
    Math.min(4, (suggestion.widthFraction * canvasWidth) / baseArtworkWidth)
  );

  return {
    x: targetCenterX - baseCenterX,
    y: targetCenterY - baseCenterY,
    scale: targetScale,
    rotation: suggestion.rotation,
  };
}

export function parseAiLayoutSuggestion(raw: unknown): AiLayoutSuggestion {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid layout response from AI');
  }

  const data = raw as Record<string, unknown>;
  const centerX = Number(data.centerX);
  const centerY = Number(data.centerY);
  const widthFraction = Number(data.widthFraction);
  const rotation = Number(data.rotation ?? 0);

  if (
    !Number.isFinite(centerX) ||
    !Number.isFinite(centerY) ||
    !Number.isFinite(widthFraction)
  ) {
    throw new Error('Invalid layout response from AI');
  }

  return {
    centerX: Math.max(0.08, Math.min(0.92, centerX)),
    centerY: Math.max(0.08, Math.min(0.92, centerY)),
    widthFraction: Math.max(0.04, Math.min(0.55, widthFraction)),
    rotation: Number.isFinite(rotation) ? rotation : 0,
  };
}
