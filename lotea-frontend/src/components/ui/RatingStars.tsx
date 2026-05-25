import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../../styles/colors";
import { spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

interface RatingStarsProps {
  value: number;
  size?: number;
  total?: number;
  showValue?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function RatingStars({
  value,
  size = 18,
  total,
  showValue = false,
  style,
}: RatingStarsProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => {
          const icon =
            value >= star
              ? "star"
              : value >= star - 0.5
                ? "star-half"
                : "star-outline";

          return (
            <Ionicons
              key={star}
              name={icon}
              size={size}
              color={colors.warning}
            />
          );
        })}
      </View>

      {showValue && (
        <Text style={styles.valueText}>
          {value.toFixed(1)} ({total ?? 0}{" "}
          {(total ?? 0) === 1 ? "valoracion" : "valoraciones"})
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  stars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  valueText: {
    ...typography.bodyStrong,
    color: colors.text,
  },
});
