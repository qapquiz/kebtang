# kebtang

A fast, minimal expense tracker built with Expo. No accounts, no cloud, no chores — just open, type an amount, tap a category, done.

## The Two-Tap Flow

```
Open app → Type amount → Tap category emoji → ✅ Saved
```

No save button. No required fields. No confirmation dialogs. The entry appears instantly in the list below.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo 56, React 19, React Native 0.85 |
| Navigation | expo-router (file-based, NativeTabs) |
| State | React hooks + Effect-TS services |
| Storage | expo-sqlite (local-first, offline) |
| Architecture | Effect-TS (Layer, Context.Tag, Effect) |
| Language | TypeScript |

## Project Structure

```
src/
├── app/                    # Routes (expo-router)
│   ├── _layout.tsx         # Root layout + DB initialization
│   ├── index.tsx           # Home — numpad + categories + today's list
│   └── history.tsx         # History — grouped by day
├── components/             # UI components
│   ├── amount-display.tsx  # Large amount + today's total
│   ├── category-bar.tsx    # Horizontal emoji picker
│   ├── numpad.tsx          # Circular numpad
│   ├── expense-item.tsx    # Single expense row (long press to delete)
│   ├── expense-list.tsx    # Scrollable expense list
│   └── undo-toast.tsx      # Undo deletion toast
├── hooks/
│   ├── use-categories.ts   # Category data hook
│   └── use-expenses.ts     # Expense CRUD hook with optimistic updates
├── lib/
│   ├── domain/             # Pure types (Expense, Category, errors)
│   ├── services/           # Effect-TS service layers
│   │   ├── database.ts     # expo-sqlite wrapper (Context.Tag)
│   │   ├── category-repository.ts
│   │   └── expense-repository.ts
│   └── runtime.ts          # Effect runtime + runEffect helper
└── constants/
    └── theme.ts            # Colors, spacing, design tokens
```

## Architecture

The app uses **Effect-TS** for a clean, testable service layer:

- **`Context.Tag`** — type-safe dependency injection for Database, ExpenseRepository, CategoryRepository
- **`Layer`** — composable service providers (swappable for tests or in-memory implementations)
- **`Effect.gen`** — typed-error async pipelines (all DB ops return `Effect<_, DatabaseError>`)
- **`Data.TaggedError`** — structured, discriminable error types

React hooks call `runEffect()` which automatically provides all service layers.

## Design Decisions

- **Amounts stored as cents** (integers) — no floating point bugs
- **Optimistic updates** — instant UI, DB writes in background
- **No save button** — tapping a category IS the save action
- **Undo toast** instead of confirmation dialogs
- **No auth, no cloud, no onboarding** — works immediately
- **Long press to delete** with undo

## Categories

🍔 Food · ☕ Coffee · 🚗 Transport · 🛒 Groceries · 🎬 Entertainment · 💊 Health · 🏠 Housing · 👕 Shopping · 💡 Bills · 📦 Other

## Getting Started

```bash
bun install
bun start
```

Then press `i` for iOS simulator, `a` for Android emulator, or `w` for web.
