import { useState, useEffect, useCallback } from "react";
import { Effect } from "effect";
import { runEffect } from "../lib/runtime";
import { CategoryRepository } from "../lib/services/category-repository";
import type { Category } from "../lib/domain/category";

export function useCategories() {
  const [categories, setCategories] = useState<ReadonlyArray<Category>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const cats = await runEffect(
        Effect.gen(function* (_) {
          const repo = yield* _(CategoryRepository);
          return yield* _(repo.getAll);
        }),
      );
      setCategories(cats);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { categories, loading, error, refresh };
}
