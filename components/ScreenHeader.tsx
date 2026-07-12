import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../constants/theme';

type ScreenHeaderProps = {
  title: string;
  rightLabel?: string;
  onRightPress?: () => void;
  onBackPress?: () => void;
  showBack?: boolean;
};

export function ScreenHeader({
  title,
  rightLabel,
  onRightPress,
  onBackPress,
  showBack = true,
}: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }
    router.back();
  };
  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.row}>
        <View style={styles.side}>
          {showBack ? (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleBack}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back" size={24} color={Colors.text} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.center}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View style={[styles.side, styles.sideRight]}>
          {rightLabel ? (
            <TouchableOpacity
              onPress={onRightPress}
              disabled={!onRightPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
    gap: Spacing.sm,
  },
  side: {
    flex: 1,
    justifyContent: 'center',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  center: {
    flexShrink: 1,
    maxWidth: '46%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: Typography.sizes.md,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  rightAction: {
    fontSize: Typography.sizes.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
    textAlign: 'right',
  },
});
