import { useCallback, useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  type SharedValue,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import type { Expense } from "../lib/domain/expense";
import type { Category } from "../lib/domain/category";
import { centsToDisplay } from "../lib/domain/expense";
import { Spacing } from "../constants/theme";
import { useTheme } from "../hooks/use-theme";

const DELETE_WIDTH = 80;
const THRESHOLD = 50;

interface SwipeableExpenseItemProps {
  expense: Expense;
  category: Category | undefined;
  onDelete: (expense: Expense) => void;
}

export function SwipeableExpenseItem({ expense, category, onDelete }: SwipeableExpenseItemProps) {
  const theme = useTheme();
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(-1); // -1 = not measured yet

  const time = new Date(expense.date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const triggerDelete = useCallback(() => {
    onDelete(expense);
  }, [expense, onDelete]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-20, 20])
        .failOffsetY([-10, 10])
        .onUpdate((event) => {
          // Only allow swiping left
          if (event.translationX < 0) {
            translateX.value = Math.max(event.translationX, -DELETE_WIDTH - 20);
          }
        })
        .onEnd(() => {
          if (translateX.value < -THRESHOLD) {
            translateX.value = withSpring(-DELETE_WIDTH, { damping: 20 });
          } else {
            translateX.value = withSpring(0, { damping: 20 });
          }
        }),
    [translateX],
  );

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, -DELETE_WIDTH],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    width: Math.abs(translateX.value),
  }));

  const onLayout = useCallback(
    (e: { nativeEvent: { layout: { height: number } } }) => {
      itemHeight.value = e.nativeEvent.layout.height;
    },
    [itemHeight],
  );

  return (
    <View onLayout={onLayout} style={styles.outer}>
      {/* Delete button underneath */}
      <Animated.View style={[styles.deleteBg, deleteBgStyle]}>
        <Pressable
          onPress={triggerDelete}
          style={styles.deleteButton}
          accessibilityRole="button"
          accessibilityLabel="Delete expense"
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </Pressable>
      </Animated.View>

      {/* Main content — swipeable */}
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.container,
            { backgroundColor: theme.backgroundElement },
            animStyle,
          ]}
        >
          <Text style={styles.emoji}>{category?.emoji ?? "📦"}</Text>
          <View style={styles.details}>
            {expense.note ? (
              <Text style={[styles.note, { color: theme.text }]} numberOfLines={1}>
                {expense.note}
              </Text>
            ) : (
              <Text style={[styles.note, { color: theme.textSecondary }]}>
                {category?.name ?? "Unknown"}
              </Text>
            )}
            <Text style={[styles.time, { color: theme.textSecondary }]}>{time}</Text>
          </View>
          <Text style={[styles.amount, { color: theme.text }]}>
            {centsToDisplay(expense.amountCents)}
          </Text>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: "relative",
    overflow: "hidden",
    borderRadius: Spacing.two,
  },
  deleteBg: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "flex-end",
    backgroundColor: "#FF3B30",
    borderTopRightRadius: Spacing.two,
    borderBottomRightRadius: Spacing.two,
  },
  deleteButton: {
    width: DELETE_WIDTH,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteIcon: {
    fontSize: 20,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    gap: Spacing.three,
  },
  emoji: {
    fontSize: 22,
  },
  details: {
    flex: 1,
    gap: 2,
  },
  note: {
    fontSize: 15,
    fontFamily: "system-ui",
  },
  time: {
    fontSize: 12,
    fontFamily: "system-ui",
  },
  amount: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "system-ui",
  },
});
