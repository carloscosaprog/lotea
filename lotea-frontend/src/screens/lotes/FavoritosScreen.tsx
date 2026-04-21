import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { getFavoritos } from "../../services/favoritosService";
import type { Lote } from "../../types/Lote";
import LoteCard from "../../components/lotes/LoteCard";
import Card from "../../components/ui/Card";
import { colors } from "../../styles/colors";
import { layoutStyles } from "../../styles/theme";
import { spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

export default function FavoritosScreen() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation<any>();

  const fetchFavoritos = async () => {
    try {
      const data = await getFavoritos();
      setLotes(data);
    } catch (error) {
      console.error("Error cargando favoritos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavoritos();
  }, []);

  if (loading) {
    return (
      <View style={layoutStyles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando favoritos...</Text>
      </View>
    );
  }

  return (
    <View style={layoutStyles.screen}>
      <FlatList
        data={lotes}
        keyExtractor={(item) => item.id_lote.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={22} color={colors.text} />
              </TouchableOpacity>

              <Text style={styles.topBarTitle}>Favoritos</Text>

              <View style={{ width: 22 }} />
            </View>

            <View style={layoutStyles.pageHeader}>
              <Text style={layoutStyles.headerEyebrow}>Guardados</Text>
              <Text style={styles.title}>Tus lotes favoritos</Text>
              <Text style={layoutStyles.headerSubtitle}>
                Accede rapidamente a los productos que te interesan.
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Card style={{ marginHorizontal: spacing.lg }}>
            <Text style={styles.emptyTitle}>Aun no tienes favoritos</Text>
            <Text style={styles.emptyText}>
              Guarda lotes pulsando el corazon para verlos aqui.
            </Text>
          </Card>
        }
        renderItem={({ item }) => (
          <View style={{ flex: 1 }}>
            <LoteCard lote={item} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingText: {
    ...typography.body,
    color: colors.subtext,
    marginTop: spacing.sm,
  },

  /* CLAVE: ocupa TODO el ancho */
  headerWrap: {
    width: "100%",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  topBarTitle: {
    ...typography.heading,
    color: colors.text,
  },

  title: {
    ...typography.title,
    color: colors.text,
  },

  listContent: {
    paddingBottom: spacing.xxxl,
  },

  /* grid separado del header */
  row: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  emptyTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.xs,
  },

  emptyText: {
    ...typography.body,
    color: colors.subtext,
  },
});
