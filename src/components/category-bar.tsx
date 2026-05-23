import { View, ScrollView, Pressable, Text, StyleSheet } from "react-native";
import { Spacing } from "../constants/theme";
import type { Category } from "../lib/domain/category";

interface CategoryBarProps {
  categories: ReadonlyArray<Category>;
  selectedId: string | null;
  onSelect: (category: Category) => void;
}

export function CategoryBar({ categories, selectedId, onSelect }: CategoryBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {categories.map((cat) => {
        const isSelected = selectedId === cat.id;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(cat)}
            style={({ pressed }) => [
              styles.category,
              pressed && styles.categoryPressed,
              isSelected && {
                backgroundColor: cat.color + "30",
                borderColor: cat.color,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={cat.name}
          >
            <Text style={styles.emoji}>{cat.emoji}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const SIZE = 52;

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    alignItems: "center",
  },
  category: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  categoryPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  emoji: {
    fontSize: 24,
  },
});
