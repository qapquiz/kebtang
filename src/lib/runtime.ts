import { Effect, Layer } from "effect";
import { DatabaseLive } from "./services/database";
import { CategoryRepositoryLive } from "./services/category-repository";
import { ExpenseRepositoryLive } from "./services/expense-repository";

const RepoLayer = Layer.merge(
  CategoryRepositoryLive,
  ExpenseRepositoryLive,
);

const MainLayer = Layer.provide(DatabaseLive)(RepoLayer);

let _seeded = false;

/**
 * Run an Effect in the app context — provides all service layers.
 * Uses module-level DB singleton so connection is reused.
 */
export function runEffect<A, E, R>(effect: Effect.Effect<A, E, R>): Promise<A> {
  // The layer provides all service requirements; cast to satisfy TypeScript
  return Effect.runPromise(
    Effect.provide(effect, MainLayer) as unknown as Effect.Effect<A, E>,
  );
}

/** Run the initial seed (default categories) */
export async function seedDefaults(): Promise<void> {
  if (_seeded) return;
  _seeded = true;
  const { CategoryRepository } = await import("./services/category-repository");
  await runEffect(
    Effect.gen(function* (_) {
      const repo = yield* _(CategoryRepository);
      yield* _(repo.seedDefaults);
    }),
  );
}
