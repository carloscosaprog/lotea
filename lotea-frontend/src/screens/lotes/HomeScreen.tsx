import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Animated,
  Easing,
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
import { getCategoryIcon } from "../../utils/categoryIcons";

interface Categoria {
  id_categoria: number;
  nombre: string;
  slug?: string;
  icono?: string;
  subcategorias?: Categoria[];
}

const sortCategories = (items: Categoria[]) =>
  [...items].sort((a, b) => {
    if (a.nombre === "Otros") return 1;
    if (b.nombre === "Otros") return -1;
    return a.nombre.localeCompare(b.nombre);
  });

function FilterCategoryCard({
  category,
  selected,
  onPress,
  onOpenSubcategories,
  isAllCategory,
}: {
  category: Categoria;
  selected: boolean;
  onPress: () => void;
  onOpenSubcategories?: () => void;
  isAllCategory?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const Icon = isAllCategory ? undefined : getCategoryIcon(category.icono);
  const hasSubcategories = !!onOpenSubcategories;

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 18,
      bounciness: 4,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View style={[styles.categoryCardMotion, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[styles.filterCategoryCard, selected && styles.filterCategoryCardActive]}
      >
        <View
          style={[
            styles.filterCategoryIcon,
            selected && styles.filterCategoryIconActive,
          ]}
        >
          {Icon ? (
            <Icon
              size={25}
              color={selected ? colors.primary : colors.text}
              strokeWidth={1.8}
            />
          ) : (
            <Ionicons
              name="apps-outline"
              size={24}
              color={selected ? colors.primary : colors.text}
            />
          )}
        </View>
        <Text
          numberOfLines={2}
          style={[
            styles.filterCategoryText,
            selected && styles.filterCategoryTextActive,
          ]}
        >
          {category.nombre}
        </Text>
      </TouchableOpacity>

      {hasSubcategories && (
        <TouchableOpacity
          activeOpacity={0.86}
          style={styles.subcategoryLink}
          onPress={onOpenSubcategories}
        >
          <Text style={styles.subcategoryLinkText}>Subcategorias</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { loading: loadingAuth, user } = useAuth();
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<
    Categoria[]
  >([]);
  const [activeCategories, setActiveCategories] = useState<string[]>(["Todas"]);
  const [search, setSearch] = useState("");
  const [distanceFilterEnabled, setDistanceFilterEnabled] = useState(false);
  const [distanceValue, setDistanceValue] = useState(25);
  const [sortBy, setSortBy] = useState<"newest" | "nearest">("newest");
  const [favoritesVersion, setFavoritesVersion] = useState(0);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [activeFilterCategory, setActiveFilterCategory] =
    useState<Categoria | null>(null);
  const contentAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(0)).current;
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
        const normalizedCategories = Array.isArray(cats) ? cats : [];

        setCategoriasDisponibles(normalizedCategories);
      } catch (e) {
        console.error("Error cargando categorias", e);
      }
    };

    loadData();
  }, [fetchLotes, loadingAuth, user]);

  useEffect(() => {
    if (loading) return;

    Animated.timing(contentAnim, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [contentAnim, loading]);

  useEffect(() => {
    if (!filtersVisible) return;

    sheetAnim.setValue(0);
    Animated.timing(sheetAnim, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [filtersVisible, sheetAnim]);

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

  const allFilterCategories = useMemo(() => {
    if (activeFilterCategory) {
      return [
        activeFilterCategory,
        ...sortCategories(activeFilterCategory.subcategorias || []),
      ];
    }

    return [
      {
        id_categoria: 0,
        nombre: "Todas",
        icono: "boxes",
      },
      ...sortCategories(categoriasDisponibles),
    ];
  }, [activeFilterCategory, categoriasDisponibles]);

  const contentAnimatedStyle = {
    opacity: contentAnim,
    transform: [
      {
        translateY: contentAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
    ],
  };

  const sheetAnimatedStyle = {
    opacity: sheetAnim,
    transform: [
      {
        translateY: sheetAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [28, 0],
        }),
      },
    ],
  };

  const handleFavoriteChange = () => setFavoritesVersion((prev) => prev + 1);

  const openFilters = () => setFiltersVisible(true);

  const closeFilters = () => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setFiltersVisible(false);
        setActiveFilterCategory(null);
      }
    });
  };

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
      <Animated.View style={[styles.marketSection, contentAnimatedStyle]}>
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
      </Animated.View>
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
            <Animated.View style={[styles.hero, contentAnimatedStyle]}>
              <View style={styles.heroTopRow}>
                <View>
                  <View style={styles.heroBadge}>
                    <Text style={styles.heroEyebrow}>Lotea</Text>
                  </View>
                  <Text style={styles.brand}>Encuentra lotes con potencial</Text>
                  <Text style={styles.heroSubtitle}>
                    Oportunidades recientes, cercanas y listas para revender.
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
                  onPress={openFilters}
                >
                  <Ionicons
                    name="options-outline"
                    size={18}
                    color={colors.white}
                  />
                  <Text style={styles.filterButtonText}>Filtros</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.heroMetaRow}>
                <Text style={styles.heroMetaText} numberOfLines={1}>
                  {sortBy === "nearest" ? "Cercanos" : "Recientes"} -{" "}
                  {distanceFilterEnabled
                    ? `${distanceValue} km`
                    : "sin limite de distancia"}{" "}
                  - {selectedCategoriesLabel}
                </Text>
                {activeFiltersCount > 0 && (
                  <View style={styles.activeFiltersBadge}>
                    <Text style={styles.activeFiltersText}>
                      {activeFiltersCount}
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>

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

            <Animated.View style={[styles.feedHeader, contentAnimatedStyle]}>
              <View>
                <Text style={styles.sectionTitle}>Todos los lotes</Text>
                <Text style={styles.sectionSubtitle}>
                  {filteredLotes.length} resultados disponibles.
                </Text>
              </View>
            </Animated.View>

            <Modal
              visible={filtersVisible}
              transparent
              animationType="fade"
              onRequestClose={closeFilters}
            >
              <View style={styles.modalRoot}>
                <Pressable
                  style={styles.modalOverlay}
                  onPress={closeFilters}
                />
                <Animated.View style={[styles.filterSheet, sheetAnimatedStyle]}>
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
                      onPress={closeFilters}
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
                      <View style={styles.filterGroupHeader}>
                        <View>
                          <View style={styles.categoryHeaderRow}>
                            {activeFilterCategory && (
                              <TouchableOpacity
                                activeOpacity={0.86}
                                style={styles.categoryBackButton}
                                onPress={() => setActiveFilterCategory(null)}
                              >
                                <Ionicons
                                  name="chevron-back"
                                  size={16}
                                  color={colors.primary}
                                />
                              </TouchableOpacity>
                            )}
                            <Text style={styles.filterGroupTitle}>
                              {activeFilterCategory
                                ? activeFilterCategory.nombre
                                : "Categorias"}
                            </Text>
                          </View>
                          <Text style={styles.filterGroupHint}>
                            {activeFilterCategory
                              ? "Selecciona la categoria padre o sus subcategorias."
                              : "Selecciona categorias padre o entra en sus subcategorias."}
                          </Text>
                        </View>
                        {!activeCategories.includes("Todas") && (
                          <Text style={styles.selectedCountText}>
                            {activeCategories.length}
                          </Text>
                        )}
                      </View>
                      <View style={styles.filterCategoriesGrid}>
                        {allFilterCategories.map((category) => {
                          const isAllCategory = category.nombre === "Todas";
                          const isActive = activeCategories.includes(
                            category.nombre,
                          );
                          const hasSubcategories =
                            !activeFilterCategory &&
                            !!category.subcategorias?.length;

                          return (
                            <FilterCategoryCard
                              key={`${category.id_categoria}-${category.nombre}`}
                              category={category}
                              selected={isActive}
                              isAllCategory={isAllCategory}
                              onPress={() => toggleCategory(category.nombre)}
                              onOpenSubcategories={
                                hasSubcategories
                                  ? () => setActiveFilterCategory(category)
                                  : undefined
                              }
                            />
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
                      onPress={closeFilters}
                    >
                      <Text style={styles.applyButtonText}>
                        Ver {filteredLotes.length} lotes
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  hero: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    overflow: "hidden",
    marginBottom: spacing.xl,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  heroBadge: {
    alignSelf: "flex-start",
    borderRadius: radii.full,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    marginBottom: spacing.sm,
  },
  heroEyebrow: {
    ...typography.overline,
    color: colors.primary,
  },
  brand: {
    ...typography.title,
    color: colors.text,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.subtext,
    marginTop: spacing.xs,
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
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: colors.border,
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
  heroMetaRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  heroMetaText: {
    ...typography.caption,
    color: colors.primary,
    flex: 1,
    fontWeight: "700",
  },
  activeFiltersBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: radii.full,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  activeFiltersText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: "700",
  },
  marketSection: {
    marginBottom: spacing.xxl,
  },
  sectionHeadingRow: {
    marginBottom: spacing.md,
  },
  sectionTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionIcon: {
    width: 36,
    height: 36,
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
    paddingRight: spacing.md,
  },
  carouselItem: {
    width: 316,
  },
  feedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
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
    gap: spacing.sm,
  },
  filterGroup: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: spacing.md,
  },
  filterGroupHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  categoryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  categoryBackButton: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  filterGroupTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  filterGroupHint: {
    ...typography.caption,
    color: colors.subtext,
    marginTop: 2,
  },
  selectedCountText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
    backgroundColor: "#EFF6FF",
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
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
    minHeight: 44,
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
  filterCategoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  categoryCardMotion: {
    width: "47.7%",
  },
  filterCategoryCard: {
    minHeight: 108,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  filterCategoryCardActive: {
    backgroundColor: "#DBEAFE",
    borderColor: colors.primary,
  },
  filterCategoryIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  filterCategoryIconActive: {
    backgroundColor: colors.white,
  },
  filterCategoryText: {
    ...typography.bodyStrong,
    color: colors.text,
    textAlign: "center",
  },
  filterCategoryTextActive: {
    color: colors.primary,
  },
  subcategoryLink: {
    minHeight: 34,
    marginTop: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
  },
  subcategoryLinkText: {
    ...typography.caption,
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
    ...typography.bodyStrong,
    color: colors.text,
  },
  sectionSubtitle: {
    ...typography.caption,
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
