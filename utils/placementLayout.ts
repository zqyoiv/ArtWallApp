import {
  ARTWORK_BASE_WIDTH,
  CANVAS_ASPECT_RATIO,
  PLACEMENT_ANCHOR_LEFT,
  PLACEMENT_ANCHOR_TOP,
} from '../constants/placement';
import { ArtworkPlacement } from './store';

export type AiLayoutSuggestion = {
  centerX: number;
  centerY: number;
  widthFraction: number;
  rotation: number;
};

export function artworkHeightForAspect(aspectRatio: number): number {
  return ARTWORK_BASE_WIDTH / aspectRatio;
}

export function placementFromAiSuggestion(
  suggestion: AiLayoutSuggestion,
  canvasWidth: number,
  aspectRatio: number
): ArtworkPlacement {
  const canvasHeight = canvasWidth / CANVAS_ASPECT_RATIO;
  const artworkHeight = artworkHeightForAspect(aspectRatio);

  const baseCenterX = PLACEMENT_ANCHOR_LEFT * canvasWidth + ARTWORK_BASE_WIDTH / 2;
  const baseCenterY = PLACEMENT_ANCHOR_TOP * canvasHeight + artworkHeight / 2;

  const targetCenterX = suggestion.centerX * canvasWidth;
  const targetCenterY = suggestion.centerY * canvasHeight;
  const targetScale = Math.max(
    0.2,
    Math.min(4, (suggestion.widthFraction * canvasWidth) / ARTWORK_BASE_WIDTH)
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
    widthFraction: Math.max(0.08, Math.min(0.55, widthFraction)),
    rotation: Number.isFinite(rotation) ? rotation : 0,
  };
}
