import { useCallback, useMemo, useRef, useState } from "react";
import { Text, View, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Effect } from "effect";

import { SwipeableExpenseItem } from "../components/expense-item";
import { UndoToast } from "../components/undo-toast";
import { useCategories } from "../hooks/use-categories";
import { useExpenseHistory, type DayGroup } from "../hooks/use-expense-history";
import { runEffect } from "../lib/runtime";
import { ExpenseRepository } from "../lib/services/expense-repository";
import type { Expense } from "../lib/domain/expense";
import type { Category } from "../lib/domain/category";
import { centsToDisplay } from "../lib/domain/expense";
import { Spacing, BottomTabInset, MaxContentWidth } from "../constants/theme";
import { useTheme } from "../hooks/use-theme";

export default function HistoryScreen() {
  const theme = useTheme();
  const { categories } = useCategories();
  const { groups, loading, refresh } = useExpenseHistory(30);

  // Undo state
  const [undoVisible, setUndoVisible] = useState(false);
  const deletedRef = useRef<Expense | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const handleDelete = useCallback(
    (expense: Expense) => {
      deletedRef.current = expense;
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

      // Delete from DB
      runEffect(
        Effect.gen(function* (_) {
          const repo = yield* _(ExpenseRepository);
          yield* _(repo.deleteById(expense.id));
        }),
      ).catch(console.error);

      // Remove from groups optimistically
      setGroups((prev) =>
        prev
          .map((g) => ({
            ...g,
            items: g.items.filter((e) => e.id !== expense.id),
          }))
          .filter((g) => g.items.length > 0)
          .map((g) => ({
            ...g,
            total: g.items.reduce((sum, e) => sum + e.amountCents, 0),
          })),
      );

      setUndoVisible(true);
      undoTimerRef.current = setTimeout(() => {
        setUndoVisible(false);
        deletedRef.current = null;
      }, 4000);
    },
    [],
  );

  // Need groups as state for optimistic updates
  const [groupsState, setGroups] = useState<ReadonlyArray<DayGroup>>([]);
  const displayGroups = groupsState.length > 0 || groups !== groupsState ? groupsState : groups;

  // Sync from hook
  const syncedRef = useRef(false);
  if (groups.length > 0 && !syncedRef.current) {
    setGroups(groups);
    syncedRef.current = true;
  }
  if (loading) syncedRef.current = false;

  const handleUndo = useCallback(async () => {
    const deleted = deletedRef.current;
    if (!deleted) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    try {
      await runEffect(
        Effect.gen(function* (_) {
          const repo = yield* _(ExpenseRepository);
          yield* _(
            repo.add({
              amountCents: deleted.amountCents,
              categoryId: deleted.categoryId,
              note: deleted.note,
              date: deleted.date,
            }),
          );
        }),
      );
    } catch (e) {
      console.error("Undo failed:", e);
    }

    // Just refresh to get clean state
    syncedRef.current = false;
    await refresh();
    setUndoVisible(false);
    deletedRef.current = null;
  }, [refresh]);

  const dismissUndo = useCallback(() => {
    setUndoVisible(false);
    deletedRef.current = null;
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.text} />
        </View>
      </SafeAreaView>
    );
  }

  const totalSpent = displayGroups.reduce((sum, g) => sum + g.total, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>History</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Last 30 days · {centsToDisplay(totalSpent)}
          </Text>
        </View>

        {/* Day groups */}
        <FlatList
          data={displayGroups as DayGroup[]}
          keyExtractor={(item) => item.dateKey}
          renderItem={({ item }) => (
            <View style={styles.dayGroup}>
              <View style={styles.dayHeader}>
                <Text style={[styles.dayLabel, { color: theme.text }]}>
                  {item.label}
                </Text>
                <Text style={[styles.dayTotal, { color: theme.textSecondary }]}>
                  {centsToDisplay(item.total)}
                </Text>
              </View>
              <View style={styles.dayItems}>
                {item.items.map((expense) => (
                  <SwipeableExpenseItem
                    key={expense.id}
                    expense={expense}
                    category={categoryMap.get(expense.categoryId)}
                    onDelete={handleDelete}
                  />
                ))}
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No expenses in the last 30 days.
              </Text>
            </View>
          }
        />

        {/* Undo */}
        <UndoToast
          visible={undoVisible}
          message="Expense deleted"
          onUndo={handleUndo}
          onDismiss={dismissUndo}
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
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.one,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "system-ui",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "system-ui",
  },
  listContent: {
    paddingBottom: BottomTabInset + Spacing.six,
  },
  dayGroup: {
    marginBottom: Spacing.three,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.four,
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
  dayItems: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  empty: {
    alignItems: "center",
    paddingVertical: Spacing.six,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "system-ui",
  },
});
