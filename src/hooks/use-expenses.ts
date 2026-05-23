import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Effect } from "effect";
import { runEffect } from "../lib/runtime";
import { ExpenseRepository } from "../lib/services/expense-repository";
import type { Expense, ExpenseInsert } from "../lib/domain/expense";

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function endOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

/** Expense data stored for undo */
export interface DeletedExpense {
  readonly expense: Expense;
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<ReadonlyArray<Expense>>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Undo stack — holds the most recently deleted expense
  const deletedRef = useRef<DeletedExpense | null>(null);
  const [undoVisible, setUndoVisible] = useState(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const now = Date.now();
      const [list, total] = await runEffect(
        Effect.gen(function* (_) {
          const repo = yield* _(ExpenseRepository);
          const list = yield* _(repo.getByDateRange(startOfDay(now), endOfDay(now)));
          const total = yield* _(repo.getTodayTotal(startOfDay(now), endOfDay(now)));
          return [list, total] as const;
        }),
      );
      setExpenses(list);
      setTodayTotal(total);
    } catch (e) {
      console.error("Failed to refresh expenses:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const addExpense = useCallback(async (params: ExpenseInsert): Promise<Expense> => {
    const expense = await runEffect(
      Effect.gen(function* (_) {
        const repo = yield* _(ExpenseRepository);
        return yield* _(repo.add(params));
      }),
    );
    setExpenses((prev) => [expense, ...prev]);
    setTodayTotal((prev) => prev + params.amountCents);
    return expense;
  }, []);

  /** Delete with undo support — stores full expense for restoration */
  const deleteExpense = useCallback((expense: Expense) => {
    // Store for undo
    deletedRef.current = { expense };

    // Dismiss any previous undo toast
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    // Optimistic removal
    setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
    setTodayTotal((prev) => prev - expense.amountCents);

    // Actually delete from DB
    runEffect(
      Effect.gen(function* (_) {
        const repo = yield* _(ExpenseRepository);
        yield* _(repo.deleteById(expense.id));
      }),
    ).catch(console.error);

    // Show undo toast
    setUndoVisible(true);
    undoTimerRef.current = setTimeout(() => {
      setUndoVisible(false);
      deletedRef.current = null;
    }, 4000);
  }, []);

  const undoDelete = useCallback(async () => {
    const deleted = deletedRef.current;
    if (!deleted) return;

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    // Re-insert into DB
    try {
      await runEffect(
        Effect.gen(function* (_) {
          const repo = yield* _(ExpenseRepository);
          return yield* _(
            repo.add({
              amountCents: deleted.expense.amountCents,
              categoryId: deleted.expense.categoryId,
              note: deleted.expense.note,
              date: deleted.expense.date,
            }),
          );
        }),
      );
    } catch (e) {
      console.error("Undo failed:", e);
    }

    // Restore in UI
    setExpenses((prev) =>
      [deleted.expense, ...prev].sort((a, b) => b.date - a.date),
    );
    setTodayTotal((prev) => prev + deleted.expense.amountCents);

    setUndoVisible(false);
    deletedRef.current = null;
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return {
    expenses,
    todayTotal,
    loading,
    refresh,
    addExpense,
    deleteExpense,
    undoVisible,
    undoDelete,
    dismissUndo: useCallback(() => {
      setUndoVisible(false);
      deletedRef.current = null;
    }, []),
  };
}
