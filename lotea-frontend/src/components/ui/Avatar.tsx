import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { colors } from "../../styles/colors";
import { radii } from "../../styles/spacing";
import { typography } from "../../styles/typography";

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export default function Avatar({
  uri,
  name,
  size = 56,
  style,
}: AvatarProps) {
  const initials = (name?.trim().charAt(0) || "U").toUpperCase();

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
        />
      ) : (
        <Text
          style={[
            styles.initials,
            {
              fontSize: Math.max(16, Math.round(size * 0.35)),
            },
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: "#DBEAFE",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: radii.full,
  },
  initials: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
});
