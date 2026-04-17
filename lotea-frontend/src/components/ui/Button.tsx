import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import { colors } from "../../styles/colors";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";
import { shadows } from "../../styles/theme";

type ButtonVariant = "primary" | "secondary" | "accent" | "danger";

interface ButtonProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const paletteByVariant: Record<
  ButtonVariant,
  {
    backgroundColor: string;
    accentColor: string;
    borderColor: string;
    textColor: string;
  }
> = {
  primary: {
    backgroundColor: colors.primary,
    accentColor: colors.primarySoft,
    borderColor: "#2563EB",
    textColor: colors.white,
  },
  secondary: {
    backgroundColor: colors.white,
    accentColor: "#EFF6FF",
    borderColor: colors.border,
    textColor: colors.text,
  },
  accent: {
    backgroundColor: colors.accent,
    accentColor: colors.accentSoft,
    borderColor: "#059669",
    textColor: colors.white,
  },
  danger: {
    backgroundColor: "#F87171",
    accentColor: "#FEE2E2",
    borderColor: "#EF4444",
    textColor: colors.white,
  },
};

export default function Button({
  title,
  onPress,
  disabled = false,
  variant = "primary",
  style,
  textStyle,
}: ButtonProps) {
  const palette = paletteByVariant[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        shadows.soft,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          opacity: disabled ? 0.6 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        style,
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.highlight,
          {
            backgroundColor: palette.accentColor,
          },
        ]}
      />
      <Text style={[styles.text, { color: palette.textColor }, textStyle]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    overflow: "hidden",
  },
  highlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "52%",
    opacity: 0.32,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
  },
  text: {
    ...typography.bodyStrong,
  },
});
