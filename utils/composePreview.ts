import type { ImageSourcePropType } from 'react-native';
import type { SizeInches, WallEstimate } from './dimensions';
import type { ArtworkPlacement } from './store';

export type ComposeArtworkInput = {
  image: ImageSourcePropType;
  uri?: string | null;
  sizeInches: SizeInches;
  placement: ArtworkPlacement;
};

export type ComposePreviewInput = {
  roomUri: string;
  /** Display canvas width used for placement coordinates. */
  canvasWidth: number;
  /** Display canvas height used for placement coordinates. */
  canvasHeight: number;
  wall: WallEstimate;
  artworks: ComposeArtworkInput[];
  /** Optional higher-res size (e.g. original photo) to upscale the cleaned room into. */
  targetWidth?: number;
  targetHeight?: number;
};

export type ComposePreviewResult = {
  uri: string;
  file: File;
  width: number;
  height: number;
};

/**
 * Build a full-resolution preview PNG (source image pixels, not a screen screenshot).
 * Web: real canvas composite. Native: falls back to view-shot via caller.
 */
export async function composePreviewDataUri(_input: ComposePreviewInput): Promise<string> {
  throw new Error('composePreviewDataUri is only implemented on web.');
}

export async function composePreviewImage(
  _input: ComposePreviewInput
): Promise<ComposePreviewResult> {
  throw new Error('composePreviewImage is only implemented on web.');
}
