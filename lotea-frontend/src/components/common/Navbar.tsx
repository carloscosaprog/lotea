import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../../styles/colors";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";
import { shadows } from "../../styles/theme";

const iconByRoute: Record<string, keyof typeof Ionicons.glyphMap> = {
  Home: "home",
  Vender: "add-circle",
  Perfil: "person",
};

const targetByRoute: Record<string, { name: string; params?: object }> = {
  Home: { name: "Home", params: { screen: "HomeMain" } },
  Vender: { name: "Vender" },
  Perfil: { name: "Perfil", params: { screen: "ProfileMain" } },
};

export default function Navbar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.shell}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : typeof options.title === "string"
                ? options.title
                : route.name;
          const isFocused = state.index === index;
          const target = targetByRoute[route.name] ?? { name: route.name };

          return (
            <Pressable
              key={route.key}
              onPress={() => (navigation as any).navigate(target.name, target.params)}
              style={styles.item}
            >
              <View style={styles.iconWrap}>
                <Ionicons
                  name={iconByRoute[route.name] || "ellipse"}
                  size={20}
                  color={isFocused ? colors.primary : colors.subtext}
                />
              </View>
              <Text style={[styles.label, isFocused && styles.labelActive]}>
                {label}
              </Text>
              <View style={[styles.indicator, isFocused && styles.indicatorActive]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  bar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    borderRadius: radii.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...typography.caption,
    color: colors.subtext,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  indicator: {
    width: 18,
    height: 3,
    borderRadius: radii.full,
    backgroundColor: "transparent",
    marginTop: 3,
  },
  indicatorActive: {
    backgroundColor: colors.primary,
  },
});

