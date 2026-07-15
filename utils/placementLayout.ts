import { artworkDisplayWidthPx, SizeInches, WallEstimate } from './dimensions';
import { ArtworkPlacement } from './store';

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

const GAP_PX = 14;
const WALL_TOP_INSET = 0.1;

/**
 * Pack artworks on the blank wall region left-to-right (wrapping rows)
 * so they do not overlap at true scale.
 */
export function layoutArtworksNonOverlapping(
  sizes: { width: number; height: number }[],
  canvasWidth: number,
  canvasHeight: number,
  wall: WallEstimate
): ArtworkPlacement[] {
  if (sizes.length === 0) return [];

  const wallWidth = wall.regionWidthFraction * canvasWidth;
  const wallLeft = (canvasWidth - wallWidth) / 2;
  const wallRight = wallLeft + wallWidth;
  const startY = canvasHeight * WALL_TOP_INSET;

  const totalSingleRow =
    sizes.reduce((sum, size) => sum + size.width, 0) + GAP_PX * Math.max(0, sizes.length - 1);

  if (totalSingleRow <= wallWidth) {
    let x = wallLeft + (wallWidth - totalSingleRow) / 2;
    const maxHeight = Math.max(...sizes.map((size) => size.height));
    return sizes.map((size) => {
      const placement: ArtworkPlacement = {
        x,
        y: startY + (maxHeight - size.height) / 2,
        scale: 1,
        rotation: 0,
      };
      x += size.width + GAP_PX;
      return placement;
    });
  }

  const placements: ArtworkPlacement[] = [];
  let x = wallLeft;
  let y = startY;
  let rowHeight = 0;

  for (const size of sizes) {
    if (x > wallLeft && x + size.width > wallRight) {
      y += rowHeight + GAP_PX;
      x = wallLeft;
      rowHeight = 0;
    }

    // If a single piece is wider than the wall, pin it to the left edge.
    const left = Math.min(x, Math.max(wallLeft, wallRight - size.width));
    placements.push({
      x: left,
      y,
      scale: 1,
      rotation: 0,
    });
    x = left + size.width + GAP_PX;
    rowHeight = Math.max(rowHeight, size.height);
  }

  return placements;
}
