import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../constants/theme';

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function SectionHeader({ title, actionLabel, onActionPress }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel ? (
        <TouchableOpacity onPress={onActionPress} disabled={!onActionPress}>
          <Text style={styles.action}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.md,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  action: {
    fontSize: Typography.sizes.sm,
    fontWeight: '500',
    color: Colors.textMuted,
  },
});
