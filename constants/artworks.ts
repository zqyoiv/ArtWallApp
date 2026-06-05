export type ArtworkItem = {
  id: string;
  title: string;
  dimensions: string;
  color: string;
};

export const RECENT_ARTWORKS: ArtworkItem[] = [
  { id: '1', title: 'Emerald Field', dimensions: '48 × 60 in', color: '#5B7A5E' },
  { id: '2', title: 'Rhythm in Color', dimensions: '36 × 48 in', color: '#C47B5A' },
  { id: '3', title: 'Coastal Light', dimensions: '24 × 36 in', color: '#6A8FA8' },
];

export const SUGGESTED_ARTWORKS: ArtworkItem[] = [
  { id: '4', title: 'Quiet Horizon', dimensions: '40 × 50 in', color: '#8B9DAF' },
  { id: '5', title: 'Golden Hour', dimensions: '30 × 40 in', color: '#D4A574' },
  { id: '6', title: 'Urban Lines', dimensions: '48 × 60 in', color: '#3D3D3D' },
  { id: '7', title: 'Soft Bloom', dimensions: '24 × 30 in', color: '#C9A0B8' },
];

export const ALL_SAMPLE_ARTWORKS = [...RECENT_ARTWORKS, ...SUGGESTED_ARTWORKS];
