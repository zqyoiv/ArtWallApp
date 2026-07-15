const fs = require('fs');
const path = require('path');

function readTarget() {
  const envTarget = (process.env.ARTWALL_TARGET || '').trim().toLowerCase();
  if (envTarget === 'web' || envTarget === 'full') {
    return envTarget;
  }
  try {
    const configPath = path.join(__dirname, 'artwall.config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return config.target === 'web' ? 'web' : 'full';
  } catch {
    return 'full';
  }
}

const target = readTarget();
const isWebOnly = target === 'web';

/** @type {import('expo/config').ExpoConfig} */
const expoConfig = {
  name: 'ArtWall',
  slug: 'art-wall-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#FFFFFF',
  },
  scheme: 'artwall',
  newArchEnabled: !isWebOnly,
  experiments: {
    typedRoutes: true,
  },
  web: {
    output: 'static',
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    'expo-image-picker',
    'expo-asset',
    'expo-font',
    ...(isWebOnly ? [] : ['expo-media-library']),
  ],
};

if (!isWebOnly) {
  expoConfig.ios = {
    supportsTablet: false,
    infoPlist: {
      NSCameraUsageDescription:
        'ArtWall needs camera access to capture your room photo.',
      NSPhotoLibraryUsageDescription:
        'ArtWall needs photo library access to select room and artwork images.',
      NSPhotoLibraryAddUsageDescription:
        'ArtWall needs permission to save your artwork previews.',
    },
  };
  expoConfig.android = {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
    permissions: [
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
    ],
  };
}

module.exports = { expo: expoConfig };
