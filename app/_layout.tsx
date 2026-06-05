// app/_layout.tsx
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { AppProvider } from '../utils/store';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AppProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.text,
            headerTitleStyle: {
              fontWeight: '600',
              fontSize: 17,
              letterSpacing: -0.3,
            },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen
            name="capture"
            options={{ title: 'Capture Room', headerBackTitle: '' }}
          />
          <Stack.Screen
            name="cleanup"
            options={{ title: 'AI Cleanup', headerBackTitle: '' }}
          />
          <Stack.Screen
            name="artwork"
            options={{ title: 'Select Artwork', headerBackTitle: '' }}
          />
          <Stack.Screen
            name="place"
            options={{ title: 'Place Artwork', headerBackTitle: '' }}
          />
          <Stack.Screen
            name="result"
            options={{ title: 'Your Preview', headerBackTitle: '' }}
          />
          <Stack.Screen
            name="settings"
            options={{ title: 'Settings', headerBackTitle: '' }}
          />
        </Stack>
      </AppProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
