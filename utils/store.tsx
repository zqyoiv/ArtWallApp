// utils/store.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SizeInches, WallEstimate } from './dimensions';

export interface ArtworkPlacement {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface AppState {
  roomName: string;
  setRoomName: (name: string) => void;

  roomImageUri: string | null;
  setRoomImageUri: (uri: string | null) => void;

  cleanedRoomUri: string | null;
  setCleanedRoomUri: (uri: string | null) => void;

  wallEstimate: WallEstimate | null;
  setWallEstimate: (wall: WallEstimate | null) => void;

  artworkUri: string | null;
  setArtworkUri: (uri: string | null) => void;

  artworkSizeInches: SizeInches | null;
  setArtworkSizeInches: (size: SizeInches | null) => void;

  placement: ArtworkPlacement;
  setPlacement: (p: ArtworkPlacement) => void;

  aiLayoutEnabled: boolean;
  setAiLayoutEnabled: (enabled: boolean) => void;

  debugMode: boolean;
  setDebugMode: (enabled: boolean) => void;

  finalImageUri: string | null;
  setFinalImageUri: (uri: string | null) => void;

  reset: () => void;
}

const defaultPlacement: ArtworkPlacement = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [roomName, setRoomName] = useState('Living Room');
  const [roomImageUri, setRoomImageUri] = useState<string | null>(null);
  const [cleanedRoomUri, setCleanedRoomUri] = useState<string | null>(null);
  const [wallEstimate, setWallEstimate] = useState<WallEstimate | null>(null);
  const [artworkUri, setArtworkUri] = useState<string | null>(null);
  const [artworkSizeInches, setArtworkSizeInches] = useState<SizeInches | null>(null);
  const [placement, setPlacement] = useState<ArtworkPlacement>(defaultPlacement);
  const [aiLayoutEnabled, setAiLayoutEnabled] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [finalImageUri, setFinalImageUri] = useState<string | null>(null);

  const reset = () => {
    setRoomImageUri(null);
    setCleanedRoomUri(null);
    setWallEstimate(null);
    setArtworkUri(null);
    setArtworkSizeInches(null);
    setPlacement(defaultPlacement);
    setAiLayoutEnabled(true);
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
        artworkUri,
        setArtworkUri,
        artworkSizeInches,
        setArtworkSizeInches,
        placement,
        setPlacement,
        aiLayoutEnabled,
        setAiLayoutEnabled,
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
