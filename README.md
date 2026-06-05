# ArtWall App — Setup & Build Guide

AI-powered artwork wall preview app built with Expo + React Native.

---

## Prerequisites

- **Node.js** 18+ → https://nodejs.org (download LTS)
- **Expo Go** app on your phone → search "Expo Go" in App Store or Google Play
- (Optional) **OpenAI API key** for AI room cleanup

---

## Step 1: Install Dependencies

Open a terminal (Command Prompt or PowerShell on Windows), navigate to this folder, and run:

```bash
npm install
```

This installs all packages listed in package.json. Takes 1–2 minutes.

---

## Step 2: Start the Dev Server

```bash
npx expo start
```

You'll see a QR code in the terminal.

---

## Step 3: Run on Your Phone

1. Open **Expo Go** on your phone
2. Tap **"Scan QR Code"**
3. Scan the QR code from your terminal
4. The app loads on your phone in a few seconds

> ⚠️ Your phone and computer must be on the **same WiFi network**.

---

## Step 4: Add OpenAI API Key (for AI cleanup)

1. Copy the example env file:
   ```bash
   copy .env.example .env
   ```
   (On Mac/Linux: `cp .env.example .env`)
2. Open `.env` and set your key:
   ```
   EXPO_PUBLIC_OPENAI_API_KEY=sk-your-key-here
   ```
3. **Restart** the dev server (`Ctrl+C`, then `npx expo start` again)

Without a key, you can still use the app — just skip cleanup and proceed with the original photo.

> `.env` is gitignored. Never commit your API key.

**To get an API key:**
1. Go to https://platform.openai.com
2. Sign in → API Keys → Create new secret key

**Cost:** Room cleanup uses GPT-Image-1, roughly $0.04–0.08 per image.

---

## App Flow

```
Home → Capture Room → AI Cleanup → Select Artwork → Place on Wall → Save/Share
```

### Screen by Screen

| Screen | File | What it does |
|--------|------|--------------|
| Home | `app/index.tsx` | Landing page, step overview |
| Settings | `app/settings.tsx` | API key status (.env setup help) |
| Capture | `app/capture.tsx` | Take photo or pick from library |
| Cleanup | `app/cleanup.tsx` | AI removes clutter from room |
| Artwork | `app/artwork.tsx` | Select artwork from photos/files |
| Place | `app/place.tsx` | Drag + pinch + rotate artwork on wall |
| Result | `app/result.tsx` | Save and share the preview |

---

## Project Structure

```
ArtWallApp/
├── app/               # All screens (Expo Router)
│   ├── _layout.tsx    # Navigation shell + providers
│   ├── index.tsx      # Home
│   ├── settings.tsx   # .env setup instructions
│   ├── capture.tsx    # Room photo capture
│   ├── cleanup.tsx    # AI cleanup
│   ├── artwork.tsx    # Artwork selection
│   ├── place.tsx      # Drag/scale/rotate placement
│   └── result.tsx     # Save & share
├── constants/
│   └── theme.ts       # Colors, typography, spacing
├── utils/
│   ├── openai.ts      # OpenAI API integration
│   └── store.ts       # Global state (React Context)
├── app.json           # Expo config
├── babel.config.js    # Babel config
└── package.json       # Dependencies
```

---

## Known MVP Limitations & How to Extend

### 1. Real composite image capture
Currently `result.tsx` shows an approximation. To capture the actual merged image:
```bash
npx expo install expo-view-shot
```
Then in `result.tsx`:
```js
import ViewShot from 'expo-view-shot';
// Wrap the canvas in <ViewShot ref={ref}>
// Call ref.current.capture() to get the URI
```

### 2. Document picker for files
`expo-document-picker` is listed but needs install:
```bash
npx expo install expo-document-picker
```

### 3. AI wall detection (V2)
Replace manual drag with automatic wall segmentation using:
- OpenAI Vision API (detect wall boundaries)
- Segment Anything Model (SAM) via a backend

### 4. Frame visualization
Add a configurable frame around the artwork in `place.tsx`:
```js
// Change borderColor and borderWidth on artworkFrame style
```

### 5. Shadow rendering
Add a shadow View behind the artwork in `place.tsx` using React Native shadow props.

---

## Build for Production (When Ready)

### Install EAS CLI
```bash
npm install -g eas-cli
eas login
eas build:configure
```

### Build for Android (APK)
```bash
eas build --platform android --profile preview
```

### Build for iOS (requires Mac or EAS cloud)
```bash
eas build --platform ios
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| App won't load on phone | Make sure phone and computer are on the same WiFi |
| Metro bundler error | Run `npx expo start --clear` |
| Package not found | Run `npm install` again |
| Camera permission denied | Go to phone Settings → Apps → Expo Go → Permissions |
| OpenAI 400 error | Image must be PNG, under 4MB, square recommended |

---

## Tech Stack

- **Expo SDK 52** — cross-platform mobile framework
- **Expo Router** — file-based navigation
- **React Native Gesture Handler** — drag, pinch, rotate
- **React Native Reanimated** — smooth 60fps animations
- **Expo Image Picker** — camera + photo library access
- **OpenAI GPT-Image-1** — AI room cleanup
