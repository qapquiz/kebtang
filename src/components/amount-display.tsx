import { View, Text, StyleSheet } from "react-native";
import { centsToDisplay } from "../lib/domain/expense";
import { Spacing } from "../constants/theme";
import { useTheme } from "../hooks/use-theme";

interface AmountDisplayProps {
  amount: string;
  todayTotal: number;
}

export function AmountDisplay({ amount, todayTotal }: AmountDisplayProps) {
  const theme = useTheme();
  const displayAmount = amount || "0";

  return (
    <View style={styles.container}>
      <Text style={[styles.amount, { color: theme.text }]}>
        ${displayAmount}
      </Text>
      <Text style={[styles.total, { color: theme.textSecondary }]}>
        Today: {centsToDisplay(todayTotal)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: Spacing.one,
  },
  amount: {
    fontSize: 48,
    fontWeight: "200",
    fontFamily: "system-ui",
    letterSpacing: -1,
  },
  total: {
    fontSize: 14,
    fontFamily: "system-ui",
  },
});
