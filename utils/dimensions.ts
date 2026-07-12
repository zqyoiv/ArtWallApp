export type SizeInches = {
  widthInches: number;
  heightInches: number;
};

export type WallEstimate = SizeInches & {
  /** Blank wall width as a fraction of the 16:9 canvas width. */
  regionWidthFraction: number;
  /** Blank wall height as a fraction of the 16:9 canvas height. */
  regionHeightFraction: number;
};

export const DEFAULT_WALL_ESTIMATE: WallEstimate = {
  widthInches: 84,
  heightInches: 66,
  regionWidthFraction: 0.78,
  regionHeightFraction: 0.45,
};

/** Debug test room blank-wall size from assets/test-room/room-dimension.csv */
export const DEBUG_WALL_ESTIMATE: WallEstimate = {
  ...DEFAULT_WALL_ESTIMATE,
  widthInches: 84,
  heightInches: 66,
};

/**
 * Parse strings like `84" × 66"`, `30 x 24 in`, `12 x 12 x 2 in`.
 * Uses the first two numbers as width × height (inches).
 */
export function parseInchesSize(raw: string): SizeInches | null {
  const matches = raw.match(/(\d+(?:\.\d+)?)/g);
  if (!matches || matches.length < 2) return null;
  const widthInches = Number(matches[0]);
  const heightInches = Number(matches[1]);
  if (!widthInches || !heightInches) return null;
  return { widthInches, heightInches };
}

export function formatInchesSize(size: SizeInches): string {
  return `${size.widthInches}" × ${size.heightInches}"`;
}

/**
 * Pixel width of artwork on the canvas so physical inches match the blank wall.
 */
export function artworkDisplayWidthPx(
  artwork: SizeInches,
  wall: WallEstimate,
  canvasWidth: number
): number {
  const wallPx = wall.regionWidthFraction * canvasWidth;
  return (artwork.widthInches / wall.widthInches) * wallPx;
}

export function parseWallEstimate(raw: unknown): WallEstimate {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid wall dimension response from AI');
  }

  const data = raw as Record<string, unknown>;
  const widthInches = Number(data.widthInches);
  const heightInches = Number(data.heightInches);
  const regionWidthFraction = Number(
    data.regionWidthFraction ?? DEFAULT_WALL_ESTIMATE.regionWidthFraction
  );
  const regionHeightFraction = Number(
    data.regionHeightFraction ?? DEFAULT_WALL_ESTIMATE.regionHeightFraction
  );

  if (!Number.isFinite(widthInches) || !Number.isFinite(heightInches)) {
    throw new Error('Invalid wall dimension response from AI');
  }

  return {
    widthInches: Math.max(24, Math.min(240, widthInches)),
    heightInches: Math.max(18, Math.min(180, heightInches)),
    regionWidthFraction: Math.max(0.35, Math.min(0.95, regionWidthFraction)),
    regionHeightFraction: Math.max(0.2, Math.min(0.75, regionHeightFraction)),
  };
}
