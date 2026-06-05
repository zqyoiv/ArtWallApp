import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../constants/theme';

type ScreenHeaderProps = {
  title: string;
  rightLabel?: string;
  onRightPress?: () => void;
  showBack?: boolean;
};

export function ScreenHeader({
  title,
  rightLabel,
  onRightPress,
  showBack = true,
}: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        {rightLabel ? (
          <TouchableOpacity onPress={onRightPress} disabled={!onRightPress}>
            <Text style={styles.rightAction}>{rightLabel}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.rightSpacer} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
  },
  iconBtn: {
    width: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.sizes.md,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  rightAction: {
    fontSize: Typography.sizes.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
    minWidth: 72,
    textAlign: 'right',
  },
  rightSpacer: {
    width: 72,
  },
});
