import {
  TouchableOpacity,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";

import { colors } from "../../styles/colors";
import { radii } from "../../styles/spacing";
import { typography } from "../../styles/typography";

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function SecondaryActionButton({
  title,
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
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 68,
    borderRadius: radii.lg,

    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",

    justifyContent: "center",
    alignItems: "center",

    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },

  text: {
    ...typography.bodyStrong,
    color: colors.primary,
    fontWeight: "800",
    fontSize: 19,
    lineHeight: 25,
  },

  disabled: {
    opacity: 0.5,
  },
});
