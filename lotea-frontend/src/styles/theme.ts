import { StyleSheet } from "react-native";

import { colors } from "./colors";
import { layout, radii, spacing } from "./spacing";
import { typography } from "./typography";

export const shadows = {
  soft: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  card: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
} as const;

export const theme = {
  colors,
  spacing,
  radii,
  typography,
  layout,
  shadows,
} as const;

export const layoutStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenContent: {
    paddingHorizontal: layout.screenHorizontal,
    paddingTop: layout.screenTop,
    paddingBottom: spacing.xxxl,
    gap: layout.sectionGap,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    paddingHorizontal: layout.screenHorizontal,
  },
  pageHeader: {
    gap: spacing.xs,
  },
  headerEyebrow: {
    ...typography.overline,
    color: colors.primary,
  },
  headerTitle: {
    ...typography.display,
    color: colors.text,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.subtext,
  },
});

export const componentStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  input: {
    height: 54,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: typography.body.fontSize,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.subtext,
  },
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: colors.accentSoft,
  },
  pillText: {
    ...typography.caption,
    color: colors.accent,
  },
});
