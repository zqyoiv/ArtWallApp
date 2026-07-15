// utils/store.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ImageSourcePropType } from 'react-native';
import { SizeInches, WallEstimate } from './dimensions';

export interface ArtworkPlacement {
  /** Absolute left on the room canvas (px). */
  x: number;
  /** Absolute top on the room canvas (px). */
  y: number;
  scale: number;
  rotation: number;
}

export type SelectedArtwork = {
  id: string;
  /** Bundled asset source — preferred for rendering (works on web + native). */
  image: ImageSourcePropType;
  /** Resolved URI when available (optional fallback). */
  uri?: string | null;
  title: string;
  sizeInches: SizeInches;
  placement: ArtworkPlacement;
};

export interface AppState {
  roomName: string;
  setRoomName: (name: string) => void;

  roomImageUri: string | null;
  setRoomImageUri: (uri: string | null) => void;

  cleanedRoomUri: string | null;
  setCleanedRoomUri: (uri: string | null) => void;

  wallEstimate: WallEstimate | null;
  setWallEstimate: (wall: WallEstimate | null) => void;

  selectedArtworks: SelectedArtwork[];
  setSelectedArtworks: (artworks: SelectedArtwork[]) => void;
  updateArtworkPlacement: (id: string, placement: ArtworkPlacement) => void;

  debugMode: boolean;
  setDebugMode: (enabled: boolean) => void;

  finalImageUri: string | null;
  setFinalImageUri: (uri: string | null) => void;

  reset: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [roomName, setRoomName] = useState('Living Room');
  const [roomImageUri, setRoomImageUri] = useState<string | null>(null);
  const [cleanedRoomUri, setCleanedRoomUri] = useState<string | null>(null);
  const [wallEstimate, setWallEstimate] = useState<WallEstimate | null>(null);
  const [selectedArtworks, setSelectedArtworks] = useState<SelectedArtwork[]>([]);
  const [debugMode, setDebugMode] = useState(false);
  const [finalImageUri, setFinalImageUri] = useState<string | null>(null);

  const updateArtworkPlacement = (id: string, placement: ArtworkPlacement) => {
    setSelectedArtworks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, placement } : item))
    );
  };

  const reset = () => {
    setRoomImageUri(null);
    setCleanedRoomUri(null);
    setWallEstimate(null);
    setSelectedArtworks([]);
    setFinalImageUri(null);
  };

  return (
    <AppContext.Provider
      value={{
        roomName,
        setRoomName,
        roomImageUri,
        setRoomImageUri,
        cleanedRoomUri,
        setCleanedRoomUri,
        wallEstimate,
        setWallEstimate,
        selectedArtworks,
        setSelectedArtworks,
        updateArtworkPlacement,
        debugMode,
        setDebugMode,
        finalImageUri,
        setFinalImageUri,
        reset,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
}
