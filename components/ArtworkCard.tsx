import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';
import type { ArtworkItem } from '../constants/artworks';

type ArtworkCardProps = {
  artwork: ArtworkItem;
  onPress: () => void;
  variant?: 'recent' | 'suggestion';
};

export function ArtworkCard({ artwork, onPress, variant = 'recent' }: ArtworkCardProps) {
  const isSuggestion = variant === 'suggestion';

  return (
    <TouchableOpacity
      style={[styles.card, isSuggestion && styles.cardSuggestion]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.thumb, { backgroundColor: artwork.color }]}>
        <View style={styles.thumbInner} />
      </View>
      {!isSuggestion && (
        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={1}>
            {artwork.title}
          </Text>
          <Text style={styles.dims}>{artwork.dimensions}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    marginRight: Spacing.md,
  },
  cardSuggestion: {
    width: 160,
  },
  thumb: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  thumbInner: {
    flex: 1,
    margin: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  meta: {
    marginTop: Spacing.sm,
    gap: 2,
  },
  title: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  dims: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
});
