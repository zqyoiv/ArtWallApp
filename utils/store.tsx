// utils/store.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

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

  artworkUri: string | null;
  setArtworkUri: (uri: string | null) => void;

  placement: ArtworkPlacement;
  setPlacement: (p: ArtworkPlacement) => void;

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
  const [artworkUri, setArtworkUri] = useState<string | null>(null);
  const [placement, setPlacement] = useState<ArtworkPlacement>(defaultPlacement);
  const [finalImageUri, setFinalImageUri] = useState<string | null>(null);

  const reset = () => {
    setRoomImageUri(null);
    setCleanedRoomUri(null);
    setArtworkUri(null);
    setPlacement(defaultPlacement);
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
        artworkUri,
        setArtworkUri,
        placement,
        setPlacement,
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
