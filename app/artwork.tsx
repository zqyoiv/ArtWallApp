// app/artwork.tsx — main screen after AI cleanup
import { Alert, ScrollView, StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ScreenHeader } from '../components/ScreenHeader';
import { RoomPreview } from '../components/RoomPreview';
import { SectionHeader } from '../components/SectionHeader';
import { AddArtButton } from '../components/AddArtButton';
import { Colors, Spacing, Typography } from '../constants/theme';
import { useAppStore } from '../utils/store';
import { normalizeImageForOpenAI } from '../utils/normalizeImage';

export default function ArtworkScreen() {
  const router = useRouter();
  const { cleanedRoomUri, roomName, setArtworkUri } = useAppStore();
  const [processingImage, setProcessingImage] = useState(false);

  const selectArtwork = (id: string, uri?: string) => {
    setArtworkUri(uri ?? `sample:${id}`);
    router.push('/place');
  };

  const pickFromGallery = async () => {
    if (processingImage) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Photo library access is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
      preferredAssetRepresentationMode:
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    if (!result.canceled && result.assets[0]) {
      setProcessingImage(true);
      try {
        const uri = await normalizeImageForOpenAI(
          result.assets[0].uri,
          result.assets[0].mimeType
        );
        selectArtwork('custom', uri);
      } catch {
        Alert.alert('Image Error', 'Could not process this photo. Please try another image.');
      } finally {
        setProcessingImage(false);
      }
    }
  };

  const pickFromPhotos = async () => {
    await pickFromGallery();
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
        <RoomPreview imageUri={cleanedRoomUri} showPlacementZone={false} />

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
          </View>
          {processingImage ? (
            <View style={styles.processingRow}>
              <ActivityIndicator size="small" color={Colors.textSecondary} />
              <Text style={styles.processingText}>Processing photo…</Text>
            </View>
          ) : null}
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
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  processingText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
});
