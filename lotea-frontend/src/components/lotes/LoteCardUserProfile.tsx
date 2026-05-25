import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

import type { Lote } from "../../types/Lote";
import Card from "../ui/Card";
import { colors } from "../../styles/colors";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";
import { toggleFavorito } from "../../services/favoritosService";
import { getImageUrl } from "../../utils/getImageUrl";
import { formatLoteLocation } from "../../utils/formatLocation";

interface Props {
  lote: Lote;
}

export default function LoteCard({ lote }: Props) {
  const navigation = useNavigation<any>();
  const [, forceUpdate] = useState(0);

  const isFavorito = lote.isFavorito ?? false;

  const totalFavoritos = lote.total_favoritos ?? 0;

  const primeraImagen = lote.imagenes?.[0];

  const imagenSrc = { uri: getImageUrl(primeraImagen) };

  const totalImagenes = lote.imagenes?.length || 0;
  const locationLabel = formatLoteLocation(lote);
  const categorias = Array.isArray(lote.categorias)
    ? lote.categorias
    : lote.categoria
      ? [lote.categoria]
      : [];

  const handleToggleFavorito = async () => {
    try {
      const res = await toggleFavorito(lote.id_lote, isFavorito);

      lote.isFavorito = res.favorito;
      lote.total_favoritos = res.total_favoritos;

      forceUpdate((prev) => prev + 1);
    } catch (error) {
      console.log("Error favorito:", error);
    }
  };

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

          <TouchableOpacity
            style={styles.likeButton}
            onPress={(e) => {
              e.stopPropagation();
              handleToggleFavorito();
            }}
          >
            <View style={styles.likeContent}>
              <Ionicons
                name={isFavorito ? "heart" : "heart-outline"}
                size={16}
                color={isFavorito ? "red" : "white"}
              />
              <Text style={styles.likeText}>{totalFavoritos}</Text>
            </View>
          </TouchableOpacity>

          {locationLabel && (
            <View style={styles.locationBadge}>
              <Ionicons
                name="location-outline"
                size={12}
                color={colors.white}
              />
              <Text style={styles.locationBadgeText} numberOfLines={1}>
                {locationLabel}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
            {lote.titulo}
          </Text>

          <Text style={styles.subtitle}>{lote.cantidad} unidades</Text>
          {locationLabel && (
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={13}
                color={colors.subtext}
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {locationLabel}
              </Text>
            </View>
          )}
          {categorias.length > 0 && (
            <View style={styles.categoryWrap}>
              {categorias.map((categoria) => (
                <View key={categoria} style={styles.categoryPill}>
                  <Text style={styles.categoryText}>{categoria}</Text>
                </View>
              ))}
            </View>
          )}
          <Text style={styles.price}>{lote.precio} EUR</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    maxWidth: "48%",
  },
  card: {
    marginBottom: spacing.sm,
    width: 350,
    height: 350,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#E0ECFF",
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  content: {
    padding: 0,
  },
  imageContainer: {
    height: 154,
    backgroundColor: "#E5E7EB",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  likeButton: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  likeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  likeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  locationBadge: {
    position: "absolute",
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    minHeight: 28,
    borderRadius: radii.full,
    backgroundColor: "rgba(17,24,39,0.62)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    gap: spacing.xxs,
  },

  locationBadgeText: {
    ...typography.caption,
    color: colors.white,
    flex: 1,
  },
  info: {
    height: 138,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
    minHeight: 10,
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "800",
  },
  subtitle: {
    ...typography.caption,
    color: colors.subtext,
    marginTop: 2,
    fontSize: 13,
    fontWeight: "600",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 3,
  },
  locationText: {
    ...typography.caption,
    color: colors.subtext,
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  categoryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#EFF6FF",
  },
  categoryPill: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: "#DBEAFE",
  },
  categoryText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
  },
  price: {
    ...typography.bodyStrong,
    color: colors.accent,
  },
});
