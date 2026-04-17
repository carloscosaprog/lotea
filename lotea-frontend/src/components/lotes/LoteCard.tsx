import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

import type { Lote } from "../../types/Lote";
import Card from "../ui/Card";
import { colors } from "../../styles/colors";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

interface Props {
  lote: Lote;
}

export default function LoteCard({ lote }: Props) {
  const navigation = useNavigation<any>();

  const imagenSrc =
    lote.imagen && lote.imagen.trim() !== ""
      ? {
          uri: lote.imagen.replace(
            "http://localhost:3000",
            "http://192.168.0.65:3000",
          ),
        }
      : { uri: "https://picsum.photos/300" };

  const totalImagenes = lote.imagenes?.length || 0;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      style={styles.wrapper}
      onPress={() =>
        navigation.navigate("Home", {
          screen: "LoteDetail",
          params: { id: lote.id_lote },
        })
      }
    >
      <Card style={styles.card} contentStyle={styles.content}>
        <View style={styles.imageContainer}>
          <Image source={imagenSrc} style={styles.image} />

          {totalImagenes > 1 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>1/{totalImagenes}</Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {lote.titulo}
          </Text>

          <Text style={styles.subtitle}>{lote.cantidad} unidades</Text>
          <Text style={styles.price}>{lote.precio} EUR</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  card: {
    marginBottom: spacing.sm,
  },
  content: {
    padding: 0,
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 154,
  },
  badge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: "rgba(17, 24, 39, 0.72)",
    paddingHorizontal: spacing.xs,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  info: {
    padding: spacing.md,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
    minHeight: 44,
  },
  subtitle: {
    ...typography.caption,
    color: colors.subtext,
    marginTop: 4,
  },
  price: {
    ...typography.heading,
    color: colors.text,
    marginTop: spacing.sm,
  },
});
