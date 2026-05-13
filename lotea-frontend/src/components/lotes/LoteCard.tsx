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

          {totalImagenes > 1 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>1/{totalImagenes}</Text>
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
  },
  card: {
    marginBottom: spacing.sm,
    height: 324,
  },
  content: {
    padding: 0,
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 140,
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
  },
  categoryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
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
    ...typography.heading,
    color: colors.text,
    marginTop: spacing.sm,
  },
});
