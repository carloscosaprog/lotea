import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import type { Lote } from "../../types/Lote";
import Card from "../ui/Card";
import { colors } from "../../styles/colors";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

interface Props {
  lote: Lote;
}

export default function LoteListItem({ lote }: Props) {
  const navigation = useNavigation<any>();

  const imageUri =
    lote.imagen && lote.imagen.trim() !== ""
      ? lote.imagen.replace(
          "http://localhost:3000",
          "http://192.168.0.65:3000",
        )
      : "https://picsum.photos/200";

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() =>
        navigation.navigate("Home", {
          screen: "LoteDetail",
          params: { id: lote.id_lote },
        })
      }
    >
      <Card contentStyle={styles.content}>
        <Image source={{ uri: imageUri }} style={styles.image} />

        <View style={styles.copy}>
          <Text numberOfLines={2} style={styles.title}>
            {lote.titulo}
          </Text>
          <Text style={styles.meta}>{lote.cantidad} unidades disponibles</Text>
          <Text style={styles.price}>{lote.precio} EUR</Text>
        </View>

        <View style={styles.actions}>
          <View style={styles.iconBubble}>
            <Ionicons name="heart-outline" size={18} color={colors.subtext} />
          </View>
          <View style={styles.iconBubble}>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    gap: spacing.sm,
  },
  image: {
    width: 92,
    height: 92,
    borderRadius: radii.md,
    backgroundColor: "#E5E7EB",
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.subtext,
  },
  price: {
    ...typography.heading,
    color: colors.accent,
  },
  actions: {
    gap: spacing.sm,
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
});
