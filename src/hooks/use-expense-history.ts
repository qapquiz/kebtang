import { useState, useEffect, useCallback } from "react";
import { Effect } from "effect";
import { runEffect } from "../lib/runtime";
import { ExpenseRepository } from "../lib/services/expense-repository";
import type { Expense } from "../lib/domain/expense";

export interface DayGroup {
  readonly dateKey: string;
  readonly label: string;
  readonly items: ReadonlyArray<Expense>;
  readonly total: number;
}

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

export function useExpenseHistory(days: number = 30) {
  const [groups, setGroups] = useState<ReadonlyArray<DayGroup>>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const now = Date.now();
      const from = startOfDay(now - days * 24 * 60 * 60 * 1000);
      const to = endOfDay(now);

      const expenses = await runEffect(
        Effect.gen(function* (_) {
          const repo = yield* _(ExpenseRepository);
          return yield* _(repo.getByDateRange(from, to));
        }),
      );

      // Group by date
      const map = new Map<string, Array<Expense>>();
      for (const exp of expenses) {
        const d = new Date(exp.date);
        const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
        const existing = map.get(key) ?? [];
        existing.push(exp);
        map.set(key, existing);
      }

      const result: DayGroup[] = [];
      for (const [dateKey, items] of map) {
        const label = new Date(items[0].date).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        result.push({
          dateKey,
          label,
          items: items.sort((a, b) => b.date - a.date),
          total: items.reduce((sum, e) => sum + e.amountCents, 0),
        });
      }

      // Sort by date descending
      result.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
      setGroups(result);
    } catch (e) {
      console.error("Failed to load history:", e);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { groups, loading, refresh };
}
