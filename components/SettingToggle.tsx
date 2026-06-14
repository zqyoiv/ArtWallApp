import { View, Text, Switch, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';

type SettingToggleProps = {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

export function SettingToggle({ label, value, onValueChange, disabled }: SettingToggleProps) {
  return (
    <View style={[styles.row, disabled && styles.disabled]}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: Colors.border, true: Colors.accent }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  label: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    fontWeight: '500',
    color: Colors.text,
    marginRight: Spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
});
