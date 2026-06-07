import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { Colors, Spacing } from '../constants/theme';

const { width } = Dimensions.get('window');
const H_PADDING = Spacing.lg;
const PREVIEW_WIDTH = width - H_PADDING * 2;
const PREVIEW_HEIGHT = PREVIEW_WIDTH * (9 / 16);

type RoomPreviewProps = {
  imageUri: string | null;
  showPlacementZone?: boolean;
  widthIn?: string;
  heightIn?: string;
};

export function RoomPreview({
  imageUri,
  showPlacementZone = false,
  widthIn = '60 in',
  heightIn = '40 in',
}: RoomPreviewProps) {
  return (
    <View style={styles.wrapper}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Room preview</Text>
        </View>
      )}

      {showPlacementZone && imageUri ? (
        <View style={styles.zoneContainer}>
          <Text style={[styles.dimLabel, styles.dimTop]}>{widthIn}</Text>
          <View style={styles.zone}>
            <Text style={[styles.dimLabel, styles.dimRight]}>{heightIn}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export const ROOM_PREVIEW_HEIGHT = PREVIEW_HEIGHT;

const styles = StyleSheet.create({
  wrapper: {
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    alignSelf: 'center',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceMuted,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceMuted,
  },
  placeholderText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  zoneContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zone: {
    width: '58%',
    height: '42%',
    borderWidth: 2,
    borderColor: Colors.placement,
    borderStyle: 'dashed',
  },
  dimLabel: {
    color: Colors.placement,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  dimTop: {
    position: 'absolute',
    top: '22%',
    alignSelf: 'center',
  },
  dimRight: {
    position: 'absolute',
    right: '14%',
    top: '42%',
  },
});
