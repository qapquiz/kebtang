export interface Expense {
  readonly id: string;
  /** Amount in cents — avoids floating point issues */
  readonly amountCents: number;
  readonly categoryId: string;
  readonly note: string;
  /** Unix timestamp ms */
  readonly date: number;
  readonly createdAt: number;
}

export interface ExpenseInsert {
  readonly amountCents: number;
  readonly categoryId: string;
  readonly note?: string;
  readonly date?: number;
}

/** Convert a decimal string like "12.50" to cents (1250) */
export function dollarsToCents(dollars: string): number {
  const cleaned = dollars.replace(/[^0-9.]/g, "");
  if (cleaned === "" || cleaned === ".") return 0;
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/** Convert cents to display string like "$12.50" */
export function centsToDisplay(cents: number): string {
  const dollars = Math.abs(cents) / 100;
  const formatted = dollars.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return cents < 0 ? `-$${formatted}` : `$${formatted}`;
}
