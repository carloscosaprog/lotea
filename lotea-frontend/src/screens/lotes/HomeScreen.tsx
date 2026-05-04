import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { getLotes } from "../../services/lotesService";
import { getFavoritos } from "../../services/favoritosService";
import type { Lote } from "../../types/Lote";
import LoteListItem from "../../components/lotes/LoteListItem";
import { colors } from "../../styles/colors";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";
import { layoutStyles } from "../../styles/theme";

const categories = [
  "Todas",
  "Electronica",
  "Moda",
  "Hogar",
  "Juguetes",
  "Oficina",
];

export default function HomeScreen() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [favoritos, setFavoritos] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategories, setActiveCategories] = useState<string[]>([
    categories[0],
  ]);
  const [search, setSearch] = useState("");

  const fetchLotes = async () => {
    try {
      const data = await getLotes();
      setLotes(data);

      try {
        const favoritosData = await getFavoritos();
        setFavoritos(favoritosData);
      } catch {
        setFavoritos([]);
      }
    } catch (error) {
      console.error("Error al cargar lotes:", error);
    } finally {
      if (!refreshing) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchLotes();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLotes();
    setRefreshing(false);
  };

  const toggleCategory = (category: string) => {
    setActiveCategories((current) => {
      if (category === "Todas") return ["Todas"];

      const withoutAll = current.filter((item) => item !== "Todas");
      const next = withoutAll.includes(category)
        ? withoutAll.filter((item) => item !== category)
        : [...withoutAll, category];

      return next.length > 0 ? next : ["Todas"];
    });
  };

  const filteredLotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    const lotesByCategory = activeCategories.includes("Todas")
      ? lotes
      : lotes.filter((item) => {
          const categorias = Array.isArray(item.categorias)
            ? item.categorias
            : item.categoria
              ? [item.categoria]
              : [];

          return activeCategories.some((category) =>
            categorias.includes(category),
          );
        });

    if (!query) return lotesByCategory;

    return lotesByCategory.filter((item) =>
      [
        item.titulo,
        item.descripcion,
        Array.isArray(item.categorias) ? item.categorias.join(" ") : "",
        item.categoria,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [activeCategories, lotes, search]);

  if (loading) {
    return (
      <View style={layoutStyles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando marketplace...</Text>
      </View>
    );
  }

  return (
    <View style={layoutStyles.screen}>
      <FlatList
        data={filteredLotes}
        keyExtractor={(item) => item.id_lote.toString()}
        renderItem={({ item }) => <LoteListItem lote={item} />}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={
          <>
            <View style={styles.hero}>
              <View style={styles.heroGlowLarge} />
              <View style={styles.heroGlowSmall} />

              <View style={styles.heroTopRow}>
                <View>
                  <Text style={styles.brand}>LOTEA</Text>
                  <Text style={styles.heroSubtitle}>
                    Encuentra lotes y oportunidades para revender.
                  </Text>
                </View>
                <View style={styles.heroIcon}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={colors.white}
                  />
                </View>
              </View>

              <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color={colors.subtext} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Buscar lotes..."
                  placeholderTextColor={colors.subtext}
                  style={styles.searchInput}
                />
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesRow}
            >
              {categories.map((category) => {
                const isActive = activeCategories.includes(category);
                return (
                  <TouchableOpacity
                    key={category}
                    activeOpacity={0.85}
                    style={[styles.pill, isActive && styles.pillActive]}
                    onPress={() => toggleCategory(category)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        isActive && styles.pillTextActive,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {favoritos.length > 0 && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Tus favoritos</Text>
                <FlatList
                  data={favoritos}
                  horizontal
                  keyExtractor={(item) => item.id_lote.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.favoriteItem}>
                      <LoteListItem lote={item} />
                    </View>
                  )}
                  contentContainerStyle={styles.favoritesList}
                  showsHorizontalScrollIndicator={false}
                />
              </View>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Lotes recomendados</Text>
              <Text style={styles.sectionSubtitle}>
                Seleccion cuidada para comprar mejor y vender mas rapido.
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>
              No hay lotes para esa busqueda
            </Text>
            <Text style={styles.emptyText}>
              Prueba con otra palabra para descubrir mas publicaciones.
            </Text>
          </View>
        }
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
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    padding: spacing.lg,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  heroGlowLarge: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: radii.full,
    backgroundColor: "rgba(255,255,255,0.14)",
    top: -70,
    right: -70,
  },
  heroGlowSmall: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: radii.full,
    backgroundColor: "rgba(147,197,253,0.35)",
    bottom: -32,
    left: -12,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  brand: {
    ...typography.title,
    color: colors.white,
  },
  heroSubtitle: {
    ...typography.caption,
    color: "#DBEAFE",
    marginTop: 2,
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    minHeight: 52,
    borderRadius: radii.full,
    backgroundColor: "rgba(255,255,255,0.88)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body.fontSize,
  },
  categoriesRow: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  pillActive: {
    backgroundColor: "#DBEAFE",
    borderColor: "#BFDBFE",
  },
  pillText: {
    ...typography.caption,
    color: colors.text,
  },
  pillTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  sectionHeader: {
    marginBottom: spacing.md,
    gap: 2,
  },
  favoritesList: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  favoriteItem: {
    width: 320,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
  },
  sectionSubtitle: {
    ...typography.body,
    color: colors.subtext,
  },
  emptyBox: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...typography.body,
    color: colors.subtext,
    textAlign: "center",
  },
});
