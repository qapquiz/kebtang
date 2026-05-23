import { useCallback, useMemo, useRef, useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AmountDisplay } from "../components/amount-display";
import { CategoryBar } from "../components/category-bar";
import { ExpenseList } from "../components/expense-list";
import { Numpad } from "../components/numpad";
import { UndoToast } from "../components/undo-toast";
import { useCategories } from "../hooks/use-categories";
import { useExpenses } from "../hooks/use-expenses";
import { Category } from "../lib/domain/category";
import { dollarsToCents } from "../lib/domain/expense";
import { Spacing, BottomTabInset, MaxContentWidth } from "../constants/theme";

export default function HomeScreen() {
  const [amount, setAmount] = useState("");
  const { categories, loading: catsLoading } = useCategories();
  const { expenses, todayTotal, addExpense, deleteExpense, refresh } = useExpenses();

  // Undo state
  const [undoState, setUndoState] = useState<{
    visible: boolean;
    message: string;
    deletedId: string;
    deletedAmount: number;
  }>({ visible: false, message: "", deletedId: "", deletedAmount: 0 });
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const handleKeyPress = useCallback((key: string) => {
    setAmount((prev) => {
      if (key === "⌫") return prev.slice(0, -1);
      if (key === ".") return prev.includes(".") ? prev : prev + ".";
      // Max 2 decimal places
      if (prev.includes(".")) {
        const [, decimals] = prev.split(".");
        if (decimals.length >= 2) return prev;
      }
      // Max total length
      if (prev.replace(".", "").length >= 8) return prev;
      return prev + key;
    });
  }, []);

  const handleCategorySelect = useCallback(
    (category: Category) => {
      const cents = dollarsToCents(amount);
      if (cents <= 0) return;

      addExpense({
        amountCents: cents,
        categoryId: category.id,
      });

      // Reset amount with a little haptic feel
      setAmount("");
    },
    [amount, addExpense],
  );

  const handleDelete = useCallback(
    (id: string, amountCents: number) => {
      if (undoTimer.current) clearTimeout(undoTimer.current);

      deleteExpense(id, amountCents);
      setUndoState({
        visible: true,
        message: "Expense deleted",
        deletedId: id,
        deletedAmount: amountCents,
      });
    },
    [deleteExpense],
  );

  const handleUndo = useCallback(async () => {
    // Re-add the expense (simplest undo: add it back)
    // For a real undo, we'd store the full expense data
    // For now, just refresh from DB
    await refresh();
    setUndoState((prev) => ({ ...prev, visible: false }));
  }, [refresh]);

  const handleDismiss = useCallback(() => {
    setUndoState((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Amount + total */}
        <AmountDisplay amount={amount} todayTotal={todayTotal} />

        {/* Category bar */}
        <View style={styles.categorySection}>
          <CategoryBar
            categories={categories}
            selectedId={null}
            onSelect={handleCategorySelect}
          />
        </View>

        {/* Expense list */}
        <View style={styles.listSection}>
          <ExpenseList
            expenses={expenses}
            categoryMap={categoryMap}
            onDelete={handleDelete}
          />
        </View>

        {/* Undo toast */}
        <View style={styles.toastContainer}>
          <UndoToast
            visible={undoState.visible}
            message={undoState.message}
            onUndo={handleUndo}
            onDismiss={handleDismiss}
          />
        </View>

        {/* Numpad */}
        <View style={styles.numpadSection}>
          <Numpad onKeyPress={handleKeyPress} />
        </View>
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
    paddingBottom: BottomTabInset,
  },
  categorySection: {
    paddingVertical: Spacing.two,
  },
  listSection: {
    flex: 1,
  },
  toastContainer: {
    paddingVertical: Spacing.one,
  },
  numpadSection: {
    paddingTop: Spacing.one,
    gap: Spacing.one,
    paddingBottom: Spacing.two,
  },
});
