import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";

import { getLotes } from "../../services/lotesService";
import type { Lote } from "../../types/Lote";
import LoteListItem from "../../components/lotes/LoteListItem";
import { colors } from "../../styles/colors";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";
import { layoutStyles } from "../../styles/theme";
import { getCategorias } from "../../services/categoriasService";
import { useAuth } from "../../context/AuthContext";

export default function HomeScreen() {
  const { loading: loadingAuth, user } = useAuth();
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<string[]>(["Todas"]);
  const [activeCategories, setActiveCategories] = useState<string[]>(["Todas"]);
  const [search, setSearch] = useState("");
  const [distanceFilterEnabled, setDistanceFilterEnabled] = useState(false);
  const [distanceValue, setDistanceValue] = useState(25);
  const [sortBy, setSortBy] = useState<"newest" | "nearest">("newest");
  const [favoritesVersion, setFavoritesVersion] = useState(0);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const profileCity = (user as any)?.ciudad;

  const fetchLotes = useCallback(async () => {
    try {
      const data = await getLotes({
        maxDistance: distanceFilterEnabled ? distanceValue : undefined,
        sortBy,
      });
      setLotes(data);
    } catch (error) {
      console.error("Error al cargar lotes:", error);
    } finally {
      setLoading(false);
    }
  }, [distanceFilterEnabled, distanceValue, sortBy]);

  useEffect(() => {
    if (loadingAuth) {
      return;
    }

    if (!user) {
      return;
    }

    const loadData = async () => {
      await fetchLotes();

      try {
        const cats = await getCategorias();

        setCategories(["Todas", ...cats.map((c: any) => c.nombre)]);
      } catch (e) {
        console.error("Error cargando categorias", e);
      }
    };

    loadData();
  }, [fetchLotes, loadingAuth, user]);

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

  const favoritos = useMemo(() => {
    void favoritesVersion;

    return lotes.filter((lote) => lote.isFavorito);
  }, [lotes, favoritesVersion]);

  const filteredLotes = useMemo(() => {
    void favoritesVersion;

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
  }, [activeCategories, lotes, search, favoritesVersion]);

  const recentlyAdded = useMemo(() => {
    return [...filteredLotes].sort((a, b) => b.id_lote - a.id_lote).slice(0, 8);
  }, [filteredLotes]);

  const nearbyLotes = useMemo(() => {
    return filteredLotes
      .filter((lote) => typeof lote.distancia_km === "number")
      .sort((a, b) => (a.distancia_km ?? 9999) - (b.distancia_km ?? 9999))
      .slice(0, 8);
  }, [filteredLotes]);

  const interestingLotes = useMemo(() => {
    return [...filteredLotes]
      .sort((a, b) => (b.total_favoritos ?? 0) - (a.total_favoritos ?? 0))
      .slice(0, 8);
  }, [filteredLotes]);

  const resaleLotes = useMemo(() => {
    return [...filteredLotes]
      .sort((a, b) => {
        const quantityDiff = (b.cantidad ?? 0) - (a.cantidad ?? 0);

        if (quantityDiff !== 0) return quantityDiff;

        return Number(a.precio ?? 0) - Number(b.precio ?? 0);
      })
      .slice(0, 8);
  }, [filteredLotes]);

  const featuredCategories = useMemo(() => {
    return categories.filter((category) => category !== "Todas").slice(0, 5);
  }, [categories]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;

    if (!activeCategories.includes("Todas")) count += activeCategories.length;
    if (distanceFilterEnabled) count += 1;
    if (sortBy === "nearest") count += 1;
    if (search.trim().length > 0) count += 1;

    return count;
  }, [activeCategories, distanceFilterEnabled, search, sortBy]);

  const selectedCategoriesLabel = activeCategories.includes("Todas")
    ? "Todas las categorias"
    : activeCategories.join(", ");

  const handleFavoriteChange = () => setFavoritesVersion((prev) => prev + 1);

  const clearFilters = () => {
    setActiveCategories(["Todas"]);
    setSearch("");
    setDistanceFilterEnabled(false);
    setDistanceValue(25);
    setSortBy("newest");
  };

  const renderHorizontalLote = ({ item }: { item: Lote }) => (
    <View style={styles.carouselItem}>
      <LoteListItem lote={item} onFavoriteChange={handleFavoriteChange} />
    </View>
  );

  const MarketplaceSection = ({
    title,
    subtitle,
    data,
    icon,
  }: {
    title: string;
    subtitle: string;
    data: Lote[];
    icon: keyof typeof Ionicons.glyphMap;
  }) => {
    if (data.length === 0) return null;

    return (
      <View style={styles.marketSection}>
        <View style={styles.sectionHeadingRow}>
          <View style={styles.sectionTitleWrap}>
            <View style={styles.sectionIcon}>
              <Ionicons name={icon} size={16} color={colors.primary} />
            </View>
            <View style={styles.sectionCopy}>
              <Text style={styles.sectionTitle}>{title}</Text>
              <Text style={styles.sectionSubtitle}>{subtitle}</Text>
            </View>
          </View>
        </View>

        <FlatList
          data={data}
          horizontal
          keyExtractor={(item) => `${title}-${item.id_lote}`}
          renderItem={renderHorizontalLote}
          contentContainerStyle={styles.carouselList}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    );
  };

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
        renderItem={({ item }) => (
          <LoteListItem lote={item} onFavoriteChange={handleFavoriteChange} />
        )}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={
          <>
            <View style={styles.hero}>
              <View style={styles.heroTopRow}>
                <View>
                  <Text style={styles.heroEyebrow}>Marketplace Lotea</Text>
                  <Text style={styles.brand}>Compra lotes mejor.</Text>
                  <Text style={styles.heroSubtitle}>
                    Encuentra oportunidades para revender cerca de ti.
                  </Text>
                </View>
              </View>

              <View style={styles.heroActions}>
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
                <TouchableOpacity
                  activeOpacity={0.86}
                  style={styles.filterButton}
                  onPress={() => setFiltersVisible(true)}
                >
                  <Ionicons
                    name="options-outline"
                    size={18}
                    color={colors.white}
                  />
                  <Text style={styles.filterButtonText}>Filtros</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.discoveryBar}>
              <View style={styles.discoveryHeader}>
                <Text style={styles.discoveryTitle}>Explorar</Text>
                <TouchableOpacity onPress={() => setFiltersVisible(true)}>
                  <Text style={styles.discoveryAction}>Ver filtros</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesRow}
              >
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.pill,
                    activeCategories.includes("Todas") && styles.pillActive,
                  ]}
                  onPress={() => toggleCategory("Todas")}
                >
                  <Text
                    style={[
                      styles.pillText,
                      activeCategories.includes("Todas") &&
                        styles.pillTextActive,
                    ]}
                  >
                    Todas
                  </Text>
                </TouchableOpacity>

                {featuredCategories.map((category) => {
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
                        numberOfLines={1}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.morePill}
                  onPress={() => setFiltersVisible(true)}
                >
                  <Ionicons
                    name="grid-outline"
                    size={14}
                    color={colors.primary}
                  />
                  <Text style={styles.morePillText}>Mas</Text>
                </TouchableOpacity>
              </ScrollView>

              <View style={styles.filterSummary}>
                <Ionicons
                  name={sortBy === "nearest" ? "navigate" : "time"}
                  size={14}
                  color={colors.primary}
                />
                <Text style={styles.filterSummaryText} numberOfLines={1}>
                  {sortBy === "nearest" ? "Cercanos" : "Recientes"} -{" "}
                  {distanceFilterEnabled
                    ? `hasta ${distanceValue} km`
                    : "sin limite de distancia"}{" "}
                  - {selectedCategoriesLabel}
                </Text>
              </View>
            </View>

            <MarketplaceSection
              title="Anadidos recientemente"
              subtitle="Nuevas oportunidades publicadas en Lotea."
              data={recentlyAdded}
              icon="sparkles-outline"
            />

            <MarketplaceSection
              title="Cerca de ti"
              subtitle={
                profileCity
                  ? `Lotes con referencia de distancia desde ${profileCity}.`
                  : "Activa tu ubicacion para descubrir mejor tu zona."
              }
              data={nearbyLotes}
              icon="navigate-outline"
            />

            <MarketplaceSection
              title="Te puede interesar"
              subtitle="Publicaciones con mas actividad de la comunidad."
              data={interestingLotes}
              icon="flame-outline"
            />

            <MarketplaceSection
              title="Recomendados para revender"
              subtitle="Lotes con mas unidades para crear margen."
              data={resaleLotes}
              icon="trending-up-outline"
            />

            <MarketplaceSection
              title="Tus favoritos"
              subtitle="Guarda aqui los lotes que quieres seguir de cerca."
              data={favoritos}
              icon="heart-outline"
            />

            <View style={styles.feedHeader}>
              <View>
                <Text style={styles.sectionTitle}>Todos los lotes</Text>
                <Text style={styles.sectionSubtitle}>
                  {filteredLotes.length} resultados disponibles.
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.86}
                style={styles.compactFilterButton}
                onPress={() => setFiltersVisible(true)}
              >
                <Ionicons
                  name="options-outline"
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.compactFilterText}>Filtrar</Text>
              </TouchableOpacity>
            </View>

            <Modal
              visible={filtersVisible}
              transparent
              animationType="slide"
              onRequestClose={() => setFiltersVisible(false)}
            >
              <View style={styles.modalRoot}>
                <Pressable
                  style={styles.modalOverlay}
                  onPress={() => setFiltersVisible(false)}
                />
                <View style={styles.filterSheet}>
                  <View style={styles.sheetHandle} />

                  <View style={styles.sheetHeader}>
                    <View>
                      <Text style={styles.sheetTitle}>Filtros</Text>
                      <Text style={styles.sheetSubtitle}>
                        Afina tu busqueda sin llenar el Home de controles.
                      </Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.closeButton}
                      onPress={() => setFiltersVisible(false)}
                    >
                      <Ionicons name="close" size={20} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.sheetContent}
                  >
                    <View style={styles.filterGroup}>
                      <Text style={styles.filterGroupTitle}>
                        Busqueda avanzada
                      </Text>
                      <View style={styles.sheetSearchBar}>
                        <Ionicons
                          name="search"
                          size={18}
                          color={colors.subtext}
                        />
                        <TextInput
                          value={search}
                          onChangeText={setSearch}
                          placeholder="Titulo, descripcion o categoria"
                          placeholderTextColor={colors.subtext}
                          style={styles.searchInput}
                        />
                      </View>
                    </View>

                    <View style={styles.filterGroup}>
                      <Text style={styles.filterGroupTitle}>Ordenar por</Text>
                      <View style={styles.sortRow}>
                        <TouchableOpacity
                          activeOpacity={0.86}
                          style={[
                            styles.sortButton,
                            sortBy === "newest" && styles.sortButtonActive,
                          ]}
                          onPress={() => setSortBy("newest")}
                        >
                          <Ionicons
                            name="time-outline"
                            size={15}
                            color={
                              sortBy === "newest"
                                ? colors.primary
                                : colors.subtext
                            }
                          />
                          <Text
                            style={[
                              styles.sortButtonText,
                              sortBy === "newest" &&
                                styles.sortButtonTextActive,
                            ]}
                          >
                            Recientes
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.86}
                          style={[
                            styles.sortButton,
                            sortBy === "nearest" && styles.sortButtonActive,
                          ]}
                          onPress={() => setSortBy("nearest")}
                        >
                          <Ionicons
                            name="navigate-outline"
                            size={15}
                            color={
                              sortBy === "nearest"
                                ? colors.primary
                                : colors.subtext
                            }
                          />
                          <Text
                            style={[
                              styles.sortButtonText,
                              sortBy === "nearest" &&
                                styles.sortButtonTextActive,
                            ]}
                          >
                            Cercanos
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.filterGroup}>
                      <View style={styles.distanceHeader}>
                        <View style={styles.distanceTitleWrap}>
                          <Ionicons
                            name="location-outline"
                            size={18}
                            color={colors.primary}
                          />
                          <View>
                            <Text style={styles.distanceTitle}>
                              Rango de distancia
                            </Text>
                            <Text style={styles.distanceSubtitle}>
                              {profileCity ||
                                "Configura tu ubicacion en Perfil"}
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          activeOpacity={0.86}
                          style={[
                            styles.switchButton,
                            distanceFilterEnabled && styles.switchButtonActive,
                          ]}
                          onPress={() => {
                            setDistanceFilterEnabled((current) => !current);
                            setSortBy("nearest");
                          }}
                        >
                          <Text
                            style={[
                              styles.switchText,
                              distanceFilterEnabled && styles.switchTextActive,
                            ]}
                          >
                            {distanceFilterEnabled ? "Activo" : "Todos"}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View
                        style={[
                          styles.sliderWrap,
                          !distanceFilterEnabled && styles.sliderWrapDisabled,
                        ]}
                      >
                        <View style={styles.sliderValueRow}>
                          <Text style={styles.sliderLabel}>Radio maximo</Text>
                          <Text style={styles.sliderValue}>
                            {distanceValue} km
                          </Text>
                        </View>
                        <Slider
                          value={distanceValue}
                          minimumValue={1}
                          maximumValue={100}
                          step={1}
                          minimumTrackTintColor={colors.primary}
                          maximumTrackTintColor={colors.border}
                          thumbTintColor={colors.primary}
                          disabled={!distanceFilterEnabled}
                          onValueChange={setDistanceValue}
                        />
                        <View style={styles.sliderScale}>
                          <Text style={styles.sliderScaleText}>1 km</Text>
                          <Text style={styles.sliderScaleText}>100 km</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.filterGroup}>
                      <Text style={styles.filterGroupTitle}>Categorias</Text>
                      <View style={styles.sheetCategoriesGrid}>
                        {categories.map((category) => {
                          const isActive = activeCategories.includes(category);

                          return (
                            <TouchableOpacity
                              key={category}
                              activeOpacity={0.85}
                              style={[
                                styles.sheetCategory,
                                isActive && styles.sheetCategoryActive,
                              ]}
                              onPress={() => toggleCategory(category)}
                            >
                              <Text
                                style={[
                                  styles.sheetCategoryText,
                                  isActive && styles.sheetCategoryTextActive,
                                ]}
                                numberOfLines={1}
                              >
                                {category}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    <View style={styles.futureFilters}>
                      <View style={styles.futureIcon}>
                        <Ionicons name="add" size={16} color={colors.primary} />
                      </View>
                      <View style={styles.futureCopy}>
                        <Text style={styles.futureTitle}>
                          Mas filtros pronto
                        </Text>
                        <Text style={styles.futureText}>
                          Precio, cantidad minima, vendedor y estado encajan
                          aqui sin cambiar la estructura.
                        </Text>
                      </View>
                    </View>
                  </ScrollView>

                  <View style={styles.sheetFooter}>
                    <TouchableOpacity
                      activeOpacity={0.86}
                      style={styles.clearButton}
                      onPress={clearFilters}
                    >
                      <Text style={styles.clearButtonText}>Limpiar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.86}
                      style={styles.applyButton}
                      onPress={() => setFiltersVisible(false)}
                    >
                      <Text style={styles.applyButtonText}>
                        Ver {filteredLotes.length} lotes
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
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
    backgroundColor: colors.text,
    borderRadius: radii.xl,
    padding: spacing.lg,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  heroEyebrow: {
    ...typography.overline,
    color: colors.primarySoft,
    marginBottom: 2,
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
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  filterDot: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: radii.full,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterDotText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
    minHeight: 52,
    borderRadius: radii.full,
    backgroundColor: colors.white,
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
  filterButton: {
    minHeight: 52,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  filterButtonText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: "700",
  },
  discoveryBar: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: spacing.md,
    marginBottom: spacing.xl,
  },
  discoveryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  discoveryTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  discoveryAction: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
  },
  categoriesRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
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
  morePill: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  morePillText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
  },
  filterSummary: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  filterSummaryText: {
    ...typography.caption,
    color: colors.subtext,
    flex: 1,
  },
  marketSection: {
    marginBottom: spacing.xl,
  },
  sectionHeadingRow: {
    marginBottom: spacing.sm,
  },
  sectionTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionCopy: {
    flex: 1,
  },
  carouselList: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  carouselItem: {
    width: 318,
  },
  feedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  compactFilterButton: {
    minHeight: 38,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  compactFilterText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  filterSheet: {
    maxHeight: "88%",
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.sm,
    overflow: "hidden",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: radii.full,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  sheetTitle: {
    ...typography.heading,
    color: colors.text,
  },
  sheetSubtitle: {
    ...typography.caption,
    color: colors.subtext,
    marginTop: 2,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  filterGroup: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: spacing.md,
  },
  filterGroupTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  sheetSearchBar: {
    minHeight: 50,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  distanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  distanceTitleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  distanceTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  distanceSubtitle: {
    ...typography.caption,
    color: colors.subtext,
    marginTop: 2,
  },
  switchButton: {
    minHeight: 36,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  switchButtonActive: {
    backgroundColor: "#DBEAFE",
    borderColor: "#BFDBFE",
  },
  switchText: {
    ...typography.caption,
    color: colors.subtext,
    fontWeight: "700",
  },
  switchTextActive: {
    color: colors.primary,
  },
  sliderWrap: {
    gap: spacing.xs,
  },
  sliderWrapDisabled: {
    opacity: 0.42,
  },
  sliderValueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sliderLabel: {
    ...typography.caption,
    color: colors.subtext,
  },
  sliderValue: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  sliderScale: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderScaleText: {
    ...typography.caption,
    color: colors.subtext,
  },
  sortRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  sortButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  sortButtonActive: {
    backgroundColor: "#DBEAFE",
    borderColor: "#BFDBFE",
  },
  sortButtonText: {
    ...typography.caption,
    color: colors.subtext,
    fontWeight: "700",
  },
  sortButtonTextActive: {
    color: colors.primary,
  },
  sheetCategoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  sheetCategory: {
    maxWidth: "48%",
    minHeight: 38,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetCategoryActive: {
    backgroundColor: "#DBEAFE",
    borderColor: "#BFDBFE",
  },
  sheetCategoryText: {
    ...typography.caption,
    color: colors.text,
  },
  sheetCategoryTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  futureFilters: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    padding: spacing.md,
    flexDirection: "row",
    gap: spacing.sm,
  },
  futureIcon: {
    width: 30,
    height: 30,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  futureCopy: {
    flex: 1,
  },
  futureTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  futureText: {
    ...typography.caption,
    color: colors.subtext,
    marginTop: 2,
  },
  sheetFooter: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  clearButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  clearButtonText: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  applyButton: {
    flex: 1.4,
    minHeight: 50,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  applyButtonText: {
    ...typography.bodyStrong,
    color: colors.white,
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
