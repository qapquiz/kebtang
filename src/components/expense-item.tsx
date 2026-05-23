import { View, Text, Pressable, StyleSheet } from "react-native";
import type { Expense } from "../lib/domain/expense";
import type { Category } from "../lib/domain/category";
import { centsToDisplay } from "../lib/domain/expense";
import { Spacing } from "../constants/theme";
import { useTheme } from "../hooks/use-theme";

interface ExpenseItemProps {
  expense: Expense;
  category: Category | undefined;
  onDelete: (id: string, amountCents: number) => void;
}

export function ExpenseItem({ expense, category, onDelete }: ExpenseItemProps) {
  const theme = useTheme();
  const time = new Date(expense.date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Pressable
      onLongPress={() => onDelete(expense.id, expense.amountCents)}
      delayLongPress={500}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: theme.backgroundElement },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${category?.emoji ?? "📦"} ${centsToDisplay(expense.amountCents)}${expense.note ? ` ${expense.note}` : ""}. Long press to delete.`}
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.6,
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
