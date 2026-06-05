// app/artwork.tsx — main screen after AI cleanup
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ScreenHeader } from '../components/ScreenHeader';
import { RoomPreview } from '../components/RoomPreview';
import { SectionHeader } from '../components/SectionHeader';
import { AddArtButton } from '../components/AddArtButton';
import { Colors, Spacing } from '../constants/theme';
import { useAppStore } from '../utils/store';

export default function ArtworkScreen() {
  const router = useRouter();
  const { cleanedRoomUri, roomName, setArtworkUri } = useAppStore();

  const selectArtwork = (id: string, uri?: string) => {
    setArtworkUri(uri ?? `sample:${id}`);
    router.push('/place');
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Photo library access is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      selectArtwork('custom', result.assets[0].uri);
    }
  };

  const pickFromPhotos = async () => {
    await pickFromGallery();
  };

  const handleScanWall = () => {
    Alert.alert(
      'Scan Wall',
      'Choose artwork from your gallery to place on the wall.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Choose Photo', onPress: pickFromGallery },
      ]
    );
  };

  const handleEditRoom = () => {
    router.push('/capture');
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={roomName}
        rightLabel="Edit Room"
        onRightPress={handleEditRoom}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <RoomPreview imageUri={cleanedRoomUri} />

        <View style={styles.addArtSection}>
          <SectionHeader title="Add Art" />
          <View style={styles.addArtRow}>
            <AddArtButton
              label="From Gallery"
              icon="images-outline"
              onPress={pickFromGallery}
            />
            <AddArtButton
              label="My Photos"
              icon="image-outline"
              onPress={pickFromPhotos}
            />
            <AddArtButton
              label="Scan Wall"
              icon="scan-outline"
              onPress={handleScanWall}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing['2xl'],
  },
  addArtSection: {
    backgroundColor: Colors.surfaceMuted,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    marginTop: Spacing.lg,
  },
  addArtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
});
