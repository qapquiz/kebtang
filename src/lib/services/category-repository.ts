import { Context, Effect, Layer } from "effect";
import { Database } from "./database";
import { Category } from "../domain/category";
import { DEFAULT_CATEGORIES } from "../domain/category";
import { DatabaseError } from "../domain/errors";

export interface CategoryRepositoryShape {
  readonly seedDefaults: Effect.Effect<void, DatabaseError>;
  readonly getAll: Effect.Effect<ReadonlyArray<Category>, DatabaseError>;
}

export class CategoryRepository extends Context.Tag("app/CategoryRepository")<CategoryRepository, CategoryRepositoryShape>() {}

interface CategoryRow {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export const CategoryRepositoryLive = Layer.effect(
  CategoryRepository,
  Effect.gen(function* (_) {
    const db = yield* _(Database);

    return CategoryRepository.of({
      seedDefaults: Effect.gen(function* (_) {
        for (const cat of DEFAULT_CATEGORIES) {
          yield* _(
            db.run(
              `INSERT OR IGNORE INTO categories (id, name, emoji, color) VALUES (?, ?, ?, ?)`,
              [cat.id, cat.name, cat.emoji, cat.color],
            ),
          );
        }
      }),

      getAll: Effect.gen(function* (_) {
        const rows = yield* _(db.getAll<CategoryRow>("SELECT * FROM categories ORDER BY id"));
        return rows.map((row): Category => ({
          id: row.id,
          name: row.name,
          emoji: row.emoji,
          color: row.color,
        }));
      }),
    });
  }),
);
