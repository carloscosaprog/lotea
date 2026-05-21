import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../../styles/colors";
import { spacing, radii } from "../../styles/spacing";
import { typography } from "../../styles/typography";

interface Props {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function PrimaryActionButton({
  title,
  icon,
  onPress,
  disabled,
  style,
}: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, style, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <View style={styles.content}>
        {icon && <Ionicons name={icon} size={24} color={colors.white} />}

        <Text style={styles.text}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 68,
    borderRadius: radii.lg,

    backgroundColor: "#3B82F6",
    borderWidth: 1,
    borderColor: "#60A5FA",

    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 8,
  },

  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },

  text: {
    ...typography.bodyStrong,
    color: colors.white,
    fontWeight: "900",
    fontSize: 19,
    lineHeight: 25,
  },

  disabled: {
    opacity: 0.5,
  },
});
