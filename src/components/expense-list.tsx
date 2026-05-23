import { View, Text, FlatList, StyleSheet } from "react-native";
import type { Expense } from "../lib/domain/expense";
import type { Category } from "../lib/domain/category";
import { SwipeableExpenseItem } from "./expense-item";
import { Spacing } from "../constants/theme";
import { useTheme } from "../hooks/use-theme";

interface ExpenseListProps {
  expenses: ReadonlyArray<Expense>;
  categoryMap: Map<string, Category>;
  onDelete: (expense: Expense) => void;
}

export function ExpenseList({ expenses, categoryMap, onDelete }: ExpenseListProps) {
  const theme = useTheme();

  if (expenses.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          No expenses yet. Start tracking!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={expenses as Expense[]}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <SwipeableExpenseItem
          expense={item}
          category={categoryMap.get(item.categoryId)}
          onDelete={onDelete}
        />
      )}
      contentContainerStyle={styles.listContent}
      scrollEnabled={true}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  empty: {
    alignItems: "center",
    paddingVertical: Spacing.four,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "system-ui",
  },
});
