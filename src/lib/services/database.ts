import { Context, Effect, Layer } from "effect";
import * as SQLite from "expo-sqlite";
import { DatabaseError } from "../domain/errors";

export interface DatabaseShape {
  readonly exec: (sql: string) => Effect.Effect<void, DatabaseError>;
  readonly run: (sql: string, params?: ReadonlyArray<unknown>) => Effect.Effect<SQLite.SQLiteRunResult, DatabaseError>;
  readonly getAll: <T>(sql: string, params?: ReadonlyArray<unknown>) => Effect.Effect<ReadonlyArray<T>, DatabaseError>;
  readonly getOne: <T>(sql: string, params?: ReadonlyArray<unknown>) => Effect.Effect<T | null, DatabaseError>;
}

export class Database extends Context.Tag("app/Database")<Database, DatabaseShape>() {}

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    color TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY NOT NULL,
    amount_cents INTEGER NOT NULL,
    category_id TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    date INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)`,
  `CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id)`,
];

// Singleton DB connection
let _db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!_db) {
    _db = await SQLite.openDatabaseAsync("kebtang.db");
    for (const sql of MIGRATIONS) {
      await _db.execAsync(sql);
    }
  }
  return _db;
}

const try_ = <A>(tryFn: () => Promise<A>): Effect.Effect<A, DatabaseError> =>
  Effect.tryPromise({
    try: tryFn,
    catch: (cause) => new DatabaseError({ cause }),
  });

export const DatabaseLive = Layer.effect(
  Database,
  Effect.gen(function* (_) {
    // Initialize DB connection
    yield* _(try_(() => getDb()));

    return Database.of({
      exec: (sql) => try_(() => getDb().then((db) => db.execAsync(sql))),
      run: (sql, params = []) =>
        try_(() => getDb().then((db) => db.runAsync(sql, params as SQLite.SQLiteBindValue[]))),
      getAll: <T>(sql: string, params: ReadonlyArray<unknown> = []) =>
        try_(() => getDb().then((db) => db.getAllAsync<T>(sql, params as SQLite.SQLiteBindValue[]))),
      getOne: <T>(sql: string, params: ReadonlyArray<unknown> = []) =>
        try_(() => getDb().then((db) => db.getFirstAsync<T>(sql, params as SQLite.SQLiteBindValue[]))),
    });
  }),
);
