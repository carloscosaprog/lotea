import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";

import { getLotes } from "../../services/lotesService";
import type { Lote } from "../../types/Lote";
import { colors } from "../../styles/colors";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";
import { layoutStyles } from "../../styles/theme";
import { getCategorias } from "../../services/categoriasService";
import { useAuth } from "../../context/AuthContext";
import { getCategoryIcon } from "../../utils/categoryIcons";
import { getImageUrl } from "../../utils/getImageUrl";
import { formatLoteLocation } from "../../utils/formatLocation";
import { toggleFavorito } from "../../services/favoritosService";

const homeFluidBackground = require("../../assets/backgrounds/home-fluid-bg.png");
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
    <Animated.View
      style={[styles.categoryCardMotion, { transform: [{ scale }] }]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[
          styles.filterCategoryCard,
          selected && styles.filterCategoryCardActive,
        ]}
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

function MarketplaceLotCard({
  lote,
  onFavoriteChange,
}: {
  lote: Lote;
  onFavoriteChange?: () => void;
}) {
  const navigation = useNavigation<any>();
  const [, forceUpdate] = useState(0);
  const isFavorito = lote.isFavorito ?? false;
  const totalFavoritos = lote.total_favoritos ?? 0;
  const imageUri = getImageUrl(lote.imagenes?.[0]);
  const locationLabel = formatLoteLocation(lote);
  const categories = Array.isArray(lote.categorias)
    ? lote.categorias.slice(0, 2)
    : lote.categoria
      ? [lote.categoria]
      : [];

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
      activeOpacity={0.93}
      style={styles.productCard}
      onPress={() =>
        navigation.navigate("Home", {
          screen: "LoteDetail",
          params: { id: lote.id_lote },
        })
      }
    >
      <View style={styles.productImageWrap}>
        <Image source={{ uri: imageUri }} style={styles.productImage} />

        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.productFavorite}
          onPress={(event) => {
            event.stopPropagation();
            handleToggleFavorito();
          }}
        >
          <View style={styles.productFavoriteContent}>
            <Ionicons
              name={isFavorito ? "heart" : "heart-outline"}
              size={16}
              color={isFavorito ? "red" : "white"}
            />
            <Text style={styles.productFavoriteText}>{totalFavoritos}</Text>
          </View>
        </TouchableOpacity>

        {locationLabel && (
          <View style={styles.productLocationBadge}>
            <Ionicons name="location-outline" size={12} color={colors.white} />
            <Text style={styles.productLocationText} numberOfLines={1}>
              {locationLabel}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {lote.titulo}
        </Text>

        <View style={styles.productMetaRow}>
          <Text style={styles.productUnits} numberOfLines={1}>
            {lote.cantidad} unidades
          </Text>
          <Text style={styles.productPrice}>{lote.precio} EUR</Text>
        </View>

        {categories.length > 0 && (
          <View style={styles.productCategoryRow}>
            {categories.map((category) => (
              <View key={category} style={styles.productCategoryPill}>
                <Text style={styles.productCategoryText} numberOfLines={1}>
                  {category}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function MarketplaceListCard({
  lote,
  onFavoriteChange,
}: {
  lote: Lote;
  onFavoriteChange?: () => void;
}) {
  const navigation = useNavigation<any>();
  const [, forceUpdate] = useState(0);
  const isFavorito = lote.isFavorito ?? false;
  const totalFavoritos = lote.total_favoritos ?? 0;
  const imageUri = getImageUrl(lote.imagenes?.[0]);
  const locationLabel = formatLoteLocation(lote);
  const category = Array.isArray(lote.categorias)
    ? lote.categorias[0]
    : lote.categoria;

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
      activeOpacity={0.93}
      style={styles.feedCard}
      onPress={() =>
        navigation.navigate("Home", {
          screen: "LoteDetail",
          params: { id: lote.id_lote },
        })
      }
    >
      <View style={styles.feedImageWrap}>
        <Image source={{ uri: imageUri }} style={styles.feedImage} />

        {category && (
          <View style={styles.feedCategoryBadge}>
            <Text style={styles.feedCategoryText} numberOfLines={1}>
              {category}
            </Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        activeOpacity={0.88}
        style={styles.feedFavorite}
        onPress={(event) => {
          event.stopPropagation();
          handleToggleFavorito();
        }}
      >
        <View style={styles.feedFavoriteContent}>
          <Ionicons
            name={isFavorito ? "heart" : "heart-outline"}
            size={16}
            color={isFavorito ? "red" : "white"}
          />
          <Text style={styles.feedFavoriteText}>{totalFavoritos}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.feedInfo}>
        <View style={styles.feedTopRow}>
          <Text style={styles.feedTitle} numberOfLines={2}>
            {lote.titulo}
          </Text>
        </View>

        <Text style={styles.feedUnits} numberOfLines={1}>
          {lote.cantidad} unidades disponibles
        </Text>

        {locationLabel && (
          <View style={styles.feedLocationRow}>
            <Ionicons
              name="location-outline"
              size={13}
              color={colors.subtext}
            />
            <Text style={styles.feedLocationText} numberOfLines={1}>
              {locationLabel}
            </Text>
          </View>
        )}

        <View style={styles.feedBottomRow}>
          <Text style={styles.feedPrice}>{lote.precio} EUR</Text>
          <View style={styles.feedArrow}>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
  const [priceFilterEnabled, setPriceFilterEnabled] = useState(false);
  const [minPriceValue, setMinPriceValue] = useState(0);
  const [maxPriceValue, setMaxPriceValue] = useState(0);
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
      });
      setLotes(data);
    } catch (error) {
      console.error("Error al cargar lotes:", error);
    } finally {
      setLoading(false);
    }
  }, [distanceFilterEnabled, distanceValue]);

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
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [filtersVisible, sheetAnim]);

  const catalogMaxPrice = useMemo(() => {
    return Math.max(0, ...lotes.map((lote) => Number(lote.precio) || 0));
  }, [lotes]);

  useEffect(() => {
    if (catalogMaxPrice > 0 && maxPriceValue === 0) {
      setMaxPriceValue(catalogMaxPrice);
    }
  }, [catalogMaxPrice, maxPriceValue]);

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

    const lotesByPrice = priceFilterEnabled
      ? lotesByCategory.filter((item) => {
          const price = Number(item.precio) || 0;

          return price >= minPriceValue && price <= maxPriceValue;
        })
      : lotesByCategory;

    if (!query) return lotesByPrice;

    return lotesByPrice.filter((item) =>
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
  }, [
    activeCategories,
    lotes,
    search,
    favoritesVersion,
    maxPriceValue,
    minPriceValue,
    priceFilterEnabled,
  ]);

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
    if (priceFilterEnabled) count += 1;
    if (search.trim().length > 0) count += 1;

    return count;
  }, [activeCategories, distanceFilterEnabled, priceFilterEnabled, search]);

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
          outputRange: [360, 0],
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
    setPriceFilterEnabled(false);
    setMinPriceValue(0);
    setMaxPriceValue(catalogMaxPrice);
  };

  const renderHorizontalLote = ({ item }: { item: Lote }) => (
    <View style={styles.carouselItem}>
      <MarketplaceLotCard lote={item} onFavoriteChange={handleFavoriteChange} />
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
          <MarketplaceListCard
            lote={item}
            onFavoriteChange={handleFavoriteChange}
          />
        )}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={
          <>
            <Animated.View style={contentAnimatedStyle}>
              <ImageBackground
                source={homeFluidBackground}
                style={styles.hero}
                imageStyle={styles.heroBackgroundImage}
              >
                <View style={styles.heroOverlay}>
                  <View style={styles.heroTopRow}>
                    <View>
                      <View style={styles.heroBadge}>
                        <Text style={styles.heroEyebrow}>Lotea</Text>
                      </View>
                      <Text style={styles.brand}>Lotes con potencial real</Text>
                      <Text style={styles.heroSubtitle}>
                        Compra mejor, filtra rapido y descubre oportunidades
                        listas para revender.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.heroActions}>
                    <View style={styles.searchBar}>
                      <Ionicons
                        name="search"
                        size={18}
                        color={colors.subtext}
                      />
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
                        name="options"
                        size={18}
                        color={colors.primary}
                      />
                      <Text style={styles.filterButtonText}>Filtros</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.heroMetaRow}>
                    <Text style={styles.heroMetaText} numberOfLines={2}>
                      {activeFiltersCount === 0
                        ? "Descubre oportunidades seleccionadas para ti"
                        : [
                            distanceFilterEnabled
                              ? `hasta ${distanceValue} km`
                              : null,

                            priceFilterEnabled
                              ? `entre ${minPriceValue} y ${maxPriceValue} EUR`
                              : null,

                            !activeCategories.includes("Todas")
                              ? `${activeCategories.length} categorias seleccionadas`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" • ")}
                    </Text>

                    {activeFiltersCount > 0 && (
                      <View style={styles.activeFiltersBadge}>
                        <Text style={styles.activeFiltersText}>
                          {activeFiltersCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </ImageBackground>
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
                <Pressable style={styles.modalOverlay} onPress={closeFilters} />
                <Animated.View style={[styles.filterSheet, sheetAnimatedStyle]}>
                  <View style={styles.sheetHandle} />

                  <View style={styles.sheetHeader}>
                    <View>
                      <Text style={styles.sheetTitle}>Filtros</Text>
                      <Text style={styles.sheetSubtitle}>
                        Afina tu busqueda sin llenar el Home de controles.
                      </Text>
                    </View>
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
                      <View style={styles.rangeHeader}>
                        <View style={styles.rangeTitleWrap}>
                          <View style={styles.rangeIcon}>
                            <Ionicons
                              name="location-outline"
                              size={18}
                              color={colors.primary}
                            />
                          </View>
                          <View style={styles.rangeCopy}>
                            <Text style={styles.rangeTitle}>Distancia</Text>
                            <Text style={styles.rangeSubtitle}>
                              {profileCity ||
                                "Configura tu ubicacion en Perfil"}
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          activeOpacity={0.86}
                          style={[
                            styles.rangeToggle,
                            distanceFilterEnabled && styles.rangeToggleActive,
                          ]}
                          onPress={() => {
                            setDistanceFilterEnabled((current) => !current);
                          }}
                        >
                          <Text
                            style={[
                              styles.rangeToggleText,
                              distanceFilterEnabled &&
                                styles.rangeToggleTextActive,
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
                        <View style={styles.rangeValueCard}>
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
                      <View style={styles.rangeHeader}>
                        <View style={styles.rangeTitleWrap}>
                          <View style={styles.rangeIcon}>
                            <Ionicons
                              name="pricetag-outline"
                              size={18}
                              color={colors.primary}
                            />
                          </View>
                          <View style={styles.rangeCopy}>
                            <Text style={styles.rangeTitle}>Precio</Text>
                            <Text style={styles.rangeSubtitle}>
                              Ajusta el presupuesto para descubrir lotes
                              viables.
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          activeOpacity={0.86}
                          style={[
                            styles.rangeToggle,
                            priceFilterEnabled && styles.rangeToggleActive,
                          ]}
                          onPress={() =>
                            setPriceFilterEnabled((current) => !current)
                          }
                        >
                          <Text
                            style={[
                              styles.rangeToggleText,
                              priceFilterEnabled &&
                                styles.rangeToggleTextActive,
                            ]}
                          >
                            {priceFilterEnabled ? "Activo" : "Todos"}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View
                        style={[
                          styles.sliderWrap,
                          !priceFilterEnabled && styles.sliderWrapDisabled,
                        ]}
                      >
                        <View style={styles.priceRangeCards}>
                          <View style={styles.rangeValueCard}>
                            <Text style={styles.sliderLabel}>Minimo</Text>
                            <Text style={styles.sliderValue}>
                              {minPriceValue} EUR
                            </Text>
                          </View>
                          <View style={styles.rangeValueCard}>
                            <Text style={styles.sliderLabel}>Maximo</Text>
                            <Text style={styles.sliderValue}>
                              {maxPriceValue} EUR
                            </Text>
                          </View>
                        </View>

                        <Slider
                          value={minPriceValue}
                          minimumValue={0}
                          maximumValue={catalogMaxPrice || 1}
                          step={1}
                          minimumTrackTintColor={colors.primary}
                          maximumTrackTintColor={colors.border}
                          thumbTintColor={colors.primary}
                          disabled={!priceFilterEnabled}
                          onValueChange={(value) =>
                            setMinPriceValue(Math.min(value, maxPriceValue))
                          }
                        />
                        <Slider
                          value={maxPriceValue}
                          minimumValue={0}
                          maximumValue={catalogMaxPrice || 1}
                          step={1}
                          minimumTrackTintColor={colors.primary}
                          maximumTrackTintColor={colors.border}
                          thumbTintColor={colors.primary}
                          disabled={!priceFilterEnabled}
                          onValueChange={(value) =>
                            setMaxPriceValue(Math.max(value, minPriceValue))
                          }
                        />

                        <View style={styles.sliderScale}>
                          <Text style={styles.sliderScaleText}>0 EUR</Text>
                          <Text style={styles.sliderScaleText}>
                            {catalogMaxPrice || 0} EUR
                          </Text>
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  hero: {
    borderRadius: 32,
    overflow: "hidden",
    marginBottom: spacing.lg,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 5,
  },
  heroBackgroundImage: {
    resizeMode: "cover",
  },
  heroOverlay: {
    padding: spacing.lg,
    backgroundColor: "rgba(255,255,255,0.72)",
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
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  heroEyebrow: {
    ...typography.overline,
    color: colors.primary,
  },
  brand: {
    ...typography.display,
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
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#DBEAFE",
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
    backgroundColor: "#F0F7FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: spacing.lg,
    gap: spacing.xs,

    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  filterButtonText: {
    ...typography.bodyStrong,
    color: colors.primary,
    fontWeight: "700",
  },
  heroMetaRow: {
    minHeight: 52,
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: "rgba(255,255,255,0.72)",
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
  heroStatsRow: {
    marginTop: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E0ECFF",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroStat: {
    flex: 1,
    alignItems: "center",
    gap: 1,
  },
  heroStatValue: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  heroStatLabel: {
    ...typography.caption,
    color: colors.subtext,
  },
  heroStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
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
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
  },
  carouselItem: {
    width: 236,
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
    maxHeight: "90%",
    backgroundColor: "#F7FAFF",
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.sm,
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.16,
    shadowRadius: 26,
    elevation: 8,
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
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  filterGroup: {
    borderRadius: radii.lg,
    borderWidth: 0,
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
  rangeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  rangeTitleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  rangeIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  rangeCopy: {
    flex: 1,
  },
  rangeTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  rangeSubtitle: {
    ...typography.caption,
    color: colors.subtext,
    marginTop: 2,
  },
  rangeToggle: {
    minHeight: 36,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  rangeToggleActive: {
    backgroundColor: "#DBEAFE",
    borderColor: "#BFDBFE",
  },
  rangeToggleText: {
    ...typography.caption,
    color: colors.subtext,
    fontWeight: "700",
  },
  rangeToggleTextActive: {
    color: colors.primary,
  },
  sliderWrap: {
    gap: spacing.xs,
    borderRadius: radii.lg,
    backgroundColor: "#F8FAFC",
    padding: spacing.sm,
  },
  sliderWrapDisabled: {
    opacity: 0.42,
  },
  rangeValueCard: {
    flex: 1,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 1,
  },
  priceRangeCards: {
    flexDirection: "row",
    gap: spacing.sm,
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
  sortList: {
    gap: spacing.sm,
  },
  sortOption: {
    minHeight: 70,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    gap: spacing.sm,
  },
  sortOptionActive: {
    backgroundColor: "#DBEAFE",
    borderColor: "#BFDBFE",
  },
  sortOptionIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  sortOptionCopy: {
    flex: 1,
  },
  sortOptionTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  sortOptionText: {
    ...typography.caption,
    color: colors.subtext,
    marginTop: 1,
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
    borderWidth: 0,
    backgroundColor: "#F8FAFC",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  filterCategoryCardActive: {
    backgroundColor: "#EAF3FF",
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
  feedCard: {
    height: 164,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E0ECFF",
    flexDirection: "row",
    padding: spacing.sm,
    gap: spacing.sm,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  feedImageWrap: {
    width: 128,
    height: "100%",
    borderRadius: radii.md,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
    position: "relative",
  },
  feedImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  feedCategoryBadge: {
    position: "absolute",
    left: spacing.xs,
    right: spacing.xs,
    bottom: spacing.xs,
    minHeight: 26,
    borderRadius: radii.full,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  feedCategoryText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
  },
  feedInfo: {
    flex: 1,
    paddingVertical: spacing.xs,
  },
  feedTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
  },
  feedTitle: {
    ...typography.bodyStrong,
    color: colors.text,
    flex: 1,
    minHeight: 44,
  },
  feedFavorite: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.42)",
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: radii.full,
    zIndex: 5,
  },
  feedFavoriteText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  feedFavoriteContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  feedUnits: {
    ...typography.caption,
    color: colors.subtext,
    marginTop: 2,
  },
  feedLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: spacing.xs,
  },
  feedLocationText: {
    ...typography.caption,
    color: colors.subtext,
    flex: 1,
  },
  feedBottomRow: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  feedPrice: {
    ...typography.heading,
    color: colors.accent,
  },
  feedArrow: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  productCard: {
    width: 236,
    height: 292,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E0ECFF",
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  productImageWrap: {
    height: 154,
    backgroundColor: "#E5E7EB",
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  productFavorite: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.42)",
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: radii.full,
    zIndex: 5,
  },
  productFavoriteContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  productFavoriteText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  productLocationBadge: {
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
  productLocationText: {
    ...typography.caption,
    color: colors.white,
    flex: 1,
  },
  productInfo: {
    height: 138,
    padding: spacing.md,
    gap: spacing.sm,
  },
  productTitle: {
    ...typography.bodyStrong,
    color: colors.text,
    minHeight: 15,
  },
  productMetaRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  productUnits: {
    ...typography.caption,
    color: colors.subtext,
    flex: 1,
  },
  productPrice: {
    ...typography.bodyStrong,
    color: colors.accent,
  },
  productCategoryRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  productCategoryPill: {
    flex: 1,
    minHeight: 26,
    borderRadius: radii.full,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  productCategoryText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
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
