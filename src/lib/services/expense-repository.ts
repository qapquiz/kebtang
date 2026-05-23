import { Context, Effect, Layer } from "effect";
import { Database } from "./database";
import { Expense } from "../domain/expense";
import type { ExpenseInsert } from "../domain/expense";
import { DatabaseError } from "../domain/errors";

/** UUID v4 — works in Hermes (no `crypto` global) */
function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface ExpenseRepositoryShape {
  readonly add: (params: ExpenseInsert) => Effect.Effect<Expense, DatabaseError>;
  readonly deleteById: (id: string) => Effect.Effect<void, DatabaseError>;
  readonly getByDateRange: (startMs: number, endMs: number) => Effect.Effect<ReadonlyArray<Expense>, DatabaseError>;
  readonly getTodayTotal: (startMs: number, endMs: number) => Effect.Effect<number, DatabaseError>;
}

export class ExpenseRepository extends Context.Tag("app/ExpenseRepository")<ExpenseRepository, ExpenseRepositoryShape>() {}

interface ExpenseRow {
  id: string;
  amount_cents: number;
  category_id: string;
  note: string;
  date: number;
  created_at: number;
}

const rowToExpense = (row: ExpenseRow): Expense => ({
  id: row.id,
  amountCents: row.amount_cents,
  categoryId: row.category_id,
  note: row.note,
  date: row.date,
  createdAt: row.created_at,
});

export const ExpenseRepositoryLive = Layer.effect(
  ExpenseRepository,
  Effect.gen(function* (_) {
    const db = yield* _(Database);

    return ExpenseRepository.of({
      add: (params) =>
        Effect.gen(function* (_) {
          const id = uuid();
          const now = Date.now();
          const date = params.date ?? now;

          yield* _(
            db.run(
              `INSERT INTO expenses (id, amount_cents, category_id, note, date, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
              [id, params.amountCents, params.categoryId, params.note ?? "", date, now],
            ),
          );

          return {
            id,
            amountCents: params.amountCents,
            categoryId: params.categoryId,
            note: params.note ?? "",
            date,
            createdAt: now,
          } satisfies Expense;
        }),

      deleteById: (id) =>
        Effect.gen(function* (_) {
          yield* _(db.run("DELETE FROM expenses WHERE id = ?", [id]));
        }),

      getByDateRange: (startMs, endMs) =>
        Effect.gen(function* (_) {
          const rows = yield* _(
            db.getAll<ExpenseRow>(
              "SELECT * FROM expenses WHERE date >= ? AND date <= ? ORDER BY date DESC",
              [startMs, endMs],
            ),
          );
          return rows.map(rowToExpense);
        }),

      getTodayTotal: (startMs, endMs) =>
        Effect.gen(function* (_) {
          const row = yield* _(
            db.getOne<{ total: number }>(
              "SELECT COALESCE(SUM(amount_cents), 0) as total FROM expenses WHERE date >= ? AND date <= ?",
              [startMs, endMs],
            ),
          );
          return row?.total ?? 0;
        }),
    });
  }),
);
