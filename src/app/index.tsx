import { useCallback, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
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
import { Spacing, MaxContentWidth } from "../constants/theme";

export default function HomeScreen() {
  const [amount, setAmount] = useState("");
  const { categories } = useCategories();
  const {
    expenses,
    todayTotal,
    addExpense,
    deleteExpense,
    undoVisible,
    undoDelete,
    dismissUndo,
  } = useExpenses();

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const handleKeyPress = useCallback((key: string) => {
    setAmount((prev) => {
      if (key === "⌫") return prev.slice(0, -1);
      if (key === ".") return prev.includes(".") ? prev : prev + ".";
      if (prev.includes(".")) {
        const [, decimals] = prev.split(".");
        if (decimals.length >= 2) return prev;
      }
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

      setAmount("");
    },
    [amount, addExpense],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Amount + total */}
        <AmountDisplay amount={amount} todayTotal={todayTotal} />

        {/* Expense list with swipe-to-delete */}
        <View style={styles.listSection}>
          <ExpenseList
            expenses={expenses}
            categoryMap={categoryMap}
            onDelete={deleteExpense}
          />
        </View>

        {/* Undo toast */}
        <UndoToast
          visible={undoVisible}
          message="Expense deleted"
          onUndo={undoDelete}
          onDismiss={dismissUndo}
        />

        {/* Category bar */}
        <View style={styles.categorySection}>
          <CategoryBar
            categories={categories}
            selectedId={null}
            onSelect={handleCategorySelect}
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
  },
  categorySection: {
    paddingVertical: Spacing.two,
  },
  listSection: {
    flex: 1,
    minHeight: 0,
  },
  numpadSection: {
    gap: Spacing.one,
  },
});
