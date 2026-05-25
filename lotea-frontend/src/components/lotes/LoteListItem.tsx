import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

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
  onFavoriteChange?: () => void;
}

export default function LoteListItem({ lote, onFavoriteChange }: Props) {
  const [, forceUpdate] = useState(0);
  const navigation = useNavigation<any>();
  const isFavorito = lote.isFavorito ?? false;

  const totalFavoritos = lote.total_favoritos ?? 0;

  const primeraImagen = lote.imagenes?.[0];

  const imageUri = getImageUrl(primeraImagen);
  const locationLabel = formatLoteLocation(lote);

  const handleToggleFavorito = async () => {
    try {
      const res = await toggleFavorito(lote.id_lote, isFavorito);

      lote.isFavorito = res.favorito;
      lote.total_favoritos = res.total_favoritos;

      forceUpdate((prev) => prev + 1);
      onFavoriteChange?.();
    } catch (error) {
      console.log("Error favorito:", error);
    }
  };

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
          <Text style={styles.price}>{lote.precio} EUR</Text>
        </View>

        <View style={styles.actions}>
          {/* LIKE + CONTADOR */}
          <TouchableOpacity
            style={styles.iconBubble}
            onPress={(e) => {
              e.stopPropagation();
              handleToggleFavorito();
            }}
          >
            <View style={styles.favContainer}>
              <Ionicons
                name={isFavorito ? "heart" : "heart-outline"}
                size={16}
                color={isFavorito ? "red" : colors.subtext}
              />
              <Text style={styles.favText}>{totalFavoritos}</Text>
            </View>
          </TouchableOpacity>

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
    minHeight: 132,
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
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  locationText: {
    ...typography.caption,
    color: colors.subtext,
    flex: 1,
  },
  price: {
    ...typography.heading,
    color: colors.accent,
  },
  actions: {
    gap: spacing.sm,
  },
  iconBubble: {
    width: 48,
    height: 34,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  favContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  favText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "600",
  },
});
