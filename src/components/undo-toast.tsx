import { useEffect, useState } from "react";
import { Text, View, Pressable, StyleSheet } from "react-native";
import { Spacing } from "../constants/theme";
import { useTheme } from "../hooks/use-theme";

interface UndoToastProps {
  visible: boolean;
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoToast({ visible, message, onUndo, onDismiss }: UndoToastProps) {
  const theme = useTheme();

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onDismiss, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  if (!visible) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundElement }]}>
      <Text style={[styles.message, { color: theme.text }]}>{message}</Text>
      <Pressable onPress={onUndo} hitSlop={8}>
        <Text style={styles.undo}>UNDO</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    marginHorizontal: Spacing.three,
  },
  message: {
    fontSize: 14,
    fontFamily: "system-ui",
  },
  undo: {
    fontSize: 14,
    fontWeight: "600",
    color: "#208AEF",
    fontFamily: "system-ui",
  },
});
