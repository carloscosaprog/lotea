import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { colors } from "../../styles/colors";
import { radii, spacing } from "../../styles/spacing";
import { shadows } from "../../styles/theme";

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export default function Card({ children, style, contentStyle }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.card,
  },
  content: {
    padding: spacing.lg,
  },
});
