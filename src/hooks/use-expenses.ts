import { useState, useEffect, useCallback } from "react";
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

export function useExpenses() {
  const [expenses, setExpenses] = useState<ReadonlyArray<Expense>>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [loading, setLoading] = useState(true);

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
    // Optimistic update
    setExpenses((prev) => [expense, ...prev]);
    setTodayTotal((prev) => prev + params.amountCents);
    return expense;
  }, []);

  const deleteExpense = useCallback(async (id: string, amountCents: number) => {
    await runEffect(
      Effect.gen(function* (_) {
        const repo = yield* _(ExpenseRepository);
        yield* _(repo.deleteById(id));
      }),
    );
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setTodayTotal((prev) => prev - amountCents);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { expenses, todayTotal, loading, refresh, addExpense, deleteExpense };
}
