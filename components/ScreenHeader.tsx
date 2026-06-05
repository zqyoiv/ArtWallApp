import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../constants/theme';

/** Equal-width side slots keep the title visually centered. */
const SIDE_SLOT_WIDTH = 88;

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
        <View style={styles.sideSlot}>
          {showBack ? (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back" size={24} color={Colors.text} />
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.title} numberOfLines={1} pointerEvents="none">
          {title}
        </Text>

        <View style={[styles.sideSlot, styles.sideSlotRight]}>
          {rightLabel ? (
            <TouchableOpacity
              onPress={onRightPress}
              disabled={!onRightPress}
              style={styles.rightBtn}
            >
              <Text style={styles.rightAction} numberOfLines={1}>
                {rightLabel}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
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
    position: 'relative',
  },
  sideSlot: {
    width: SIDE_SLOT_WIDTH,
    zIndex: 1,
    justifyContent: 'center',
  },
  sideSlotRight: {
    alignItems: 'flex-end',
  },
  backBtn: {
    alignSelf: 'flex-start',
  },
  rightBtn: {
    alignSelf: 'flex-end',
  },
  title: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: Typography.sizes.md,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.3,
    paddingHorizontal: SIDE_SLOT_WIDTH,
  },
  rightAction: {
    fontSize: Typography.sizes.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
    textAlign: 'right',
  },
});
