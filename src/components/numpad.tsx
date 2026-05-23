import { StyleSheet, Text, Pressable } from "react-native";
import { Spacing } from "../constants/theme";
import { useTheme } from "../hooks/use-theme";

interface NumpadProps {
  onKeyPress: (key: string) => void;
}

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "⌫"],
];

export function Numpad({ onKeyPress }: NumpadProps) {
  const theme = useTheme();

  return (
    <>
      {KEYS.map((row, ri) => (
        <Pressable
          key={ri}
          style={styles.row}
          accessibilityRole="none"
        >
          {row.map((key) => (
            <Pressable
              key={key}
              onPress={() => onKeyPress(key)}
              style={({ pressed }) => [
                styles.key,
                pressed && styles.keyPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={key === "⌫" ? "Delete" : key}
            >
              <Text style={[styles.keyText, { color: theme.text }]}>
                {key}
              </Text>
            </Pressable>
          ))}
        </Pressable>
      ))}
    </>
  );
}

const KEY_SIZE = 64;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.two,
  },
  key: {
    width: KEY_SIZE,
    height: KEY_SIZE,
    borderRadius: KEY_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  keyPressed: {
    opacity: 0.6,
  },
  keyText: {
    fontSize: 28,
    fontWeight: "300",
    fontFamily: "system-ui",
  },
});
