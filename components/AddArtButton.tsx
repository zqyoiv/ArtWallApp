import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow, Spacing, Typography } from '../constants/theme';

type AddArtButtonProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

export function AddArtButton({ label, icon, onPress }: AddArtButtonProps) {
  return (
    <TouchableOpacity style={styles.btn} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={28} color={Colors.text} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    ...Shadow.card,
  },
  iconWrap: {
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
  },
});
