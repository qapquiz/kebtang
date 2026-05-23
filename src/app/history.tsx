import { useMemo } from "react";
import { Text, View, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ExpenseItem } from "../components/expense-item";
import { useCategories } from "../hooks/use-categories";
import { useExpenses } from "../hooks/use-expenses";
import type { Category } from "../lib/domain/category";
import { centsToDisplay } from "../lib/domain/expense";
import { Spacing, BottomTabInset, MaxContentWidth } from "../constants/theme";
import { useTheme } from "../hooks/use-theme";

export default function HistoryScreen() {
  const theme = useTheme();
  const { categories } = useCategories();
  const { expenses, deleteExpense } = useExpenses();

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Group by date
  const grouped = useMemo(() => {
    const groups = new Map<string, Array<(typeof expenses)[number]>>();
    for (const exp of expenses) {
      const key = new Date(exp.date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      const existing = groups.get(key) ?? [];
      existing.push(exp);
      groups.set(key, existing);
    }
    return Array.from(groups.entries()).map(([date, items]) => ({
      date,
      items,
      total: items.reduce((sum, e) => sum + e.amountCents, 0),
    }));
  }, [expenses]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>History</Text>
        <FlatList
          data={grouped}
          keyExtractor={(item) => item.date}
          renderItem={({ item }) => (
            <View style={styles.dayGroup}>
              <View style={styles.dayHeader}>
                <Text style={[styles.dayLabel, { color: theme.text }]}>{item.date}</Text>
                <Text style={[styles.dayTotal, { color: theme.textSecondary }]}>
                  {centsToDisplay(item.total)}
                </Text>
              </View>
              {item.items.map((expense) => (
                <ExpenseItem
                  key={expense.id}
                  expense={expense}
                  category={categoryMap.get(expense.categoryId)}
                  onDelete={deleteExpense}
                />
              ))}
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "system-ui",
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  listContent: {
    paddingBottom: BottomTabInset + Spacing.three,
  },
  dayGroup: {
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "system-ui",
  },
  dayTotal: {
    fontSize: 14,
    fontFamily: "system-ui",
  },
});
