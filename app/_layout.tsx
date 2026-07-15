// app/_layout.tsx
import { useEffect, useRef } from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet } from 'react-native';
import { AppProvider, useAppStore } from '../utils/store';
import { Colors } from '../constants/theme';

/** Keep the browser address bar at "/" so route suffixes are never visible. */
function scrubBrowserPath() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const { pathname, search, hash } = window.location;
  if (pathname !== '/' || search || hash) {
    window.history.replaceState(window.history.state, '', '/');
  }
}

/**
 * Web session rules:
 * - Refresh / deep-link always returns to the home screen
 * - Session store is cleared on fresh load
 * - URL bar stays at "/" (no /place, /artwork, etc.)
 */
function WebSessionController() {
  const pathname = usePathname();
  const router = useRouter();
  const { reset } = useAppStore();
  const bootedRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    if (!bootedRef.current) {
      bootedRef.current = true;
      reset();
      if (pathname && pathname !== '/') {
        router.replace('/');
      }
      scrubBrowserPath();
      return;
    }

    scrubBrowserPath();
    const t0 = setTimeout(scrubBrowserPath, 0);
    const t1 = setTimeout(scrubBrowserPath, 50);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
    };
  }, [pathname, reset, router]);

  return null;
}

function RootNavigator() {
  return (
    <>
      <WebSessionController />
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="capture" />
        <Stack.Screen name="cleanup" />
        <Stack.Screen name="artwork" />
        <Stack.Screen name="place" />
        <Stack.Screen name="result" />
        <Stack.Screen name="settings" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
