import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
};

export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
}: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.btn,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        (disabled || loading) && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : Colors.text} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'secondary' && styles.labelSecondary,
            variant === 'ghost' && styles.labelGhost,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  secondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: Typography.sizes.base,
  },
  labelSecondary: {
    color: Colors.text,
  },
  labelGhost: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
