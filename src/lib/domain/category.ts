export interface Category {
  readonly id: string;
  readonly name: string;
  readonly emoji: string;
  readonly color: string;
}

export const DEFAULT_CATEGORIES: ReadonlyArray<Category> = [
  { id: "food", name: "Food", emoji: "🍔", color: "#FF6B6B" },
  { id: "coffee", name: "Coffee", emoji: "☕", color: "#8B6914" },
  { id: "transport", name: "Transport", emoji: "🚗", color: "#4ECDC4" },
  { id: "groceries", name: "Groceries", emoji: "🛒", color: "#45B7D1" },
  { id: "entertainment", name: "Entertainment", emoji: "🎬", color: "#96CEB4" },
  { id: "health", name: "Health", emoji: "💊", color: "#FFEAA7" },
  { id: "housing", name: "Housing", emoji: "🏠", color: "#DDA0DD" },
  { id: "shopping", name: "Shopping", emoji: "👕", color: "#98D8C8" },
  { id: "bills", name: "Bills", emoji: "💡", color: "#F7DC6F" },
  { id: "other", name: "Other", emoji: "📦", color: "#B0BEC5" },
];
