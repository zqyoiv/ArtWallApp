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
      </AppProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
