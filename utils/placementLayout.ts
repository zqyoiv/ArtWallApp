import { artworkDisplayWidthPx, SizeInches, WallEstimate } from './dimensions';

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
