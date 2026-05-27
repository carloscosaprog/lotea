import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Alert,
  Modal,
  Dimensions,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PinchGestureHandler, State } from "react-native-gesture-handler";
import { useRoute, useNavigation } from "@react-navigation/native";
import MapView, { Circle, Marker } from "react-native-maps";

import {
  getLoteById,
  deleteLote,
  getLotesByUser,
  getLotes,
} from "../../services/lotesService";
import { getUserById } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import type { Lote } from "../../types/Lote";
import Avatar from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { colors } from "../../styles/colors";
import { componentStyles, layoutStyles } from "../../styles/theme";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";
import { API_URL } from "../../config/api";
import { getImageUrl } from "../../utils/getImageUrl";
import { formatLoteLocation } from "../../utils/formatLocation";
import { toggleFavorito, checkFavorito } from "../../services/favoritosService";
import RatingStars from "../../components/ui/RatingStars";
import { getResumenCalificaciones } from "../../services/calificacionesService";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
const screenWidth = Dimensions.get("window").width;
const APPROXIMATION_RADIUS_METERS = 900;

const getLoteCategories = (lote: Lote) =>
  Array.isArray(lote.categorias)
    ? lote.categorias.map((c: any) => (typeof c === "string" ? c : c.nombre))
    : lote.categoria
      ? [
          typeof lote.categoria === "string"
            ? lote.categoria
            : typeof lote.categoria === "object"
              ? (lote.categoria as any).nombre
              : "",
        ]
      : [];

function RelatedLoteCard({ lote }: { lote: Lote }) {
  const navigation = useNavigation<any>();
  const [, forceUpdate] = useState(0);
  const isFavorito = lote.isFavorito ?? false;
  const totalFavoritos = lote.total_favoritos ?? 0;
  const imageUri = getImageUrl(lote.imagenes?.[0]);
  const locationLabel = formatLoteLocation(lote);
  const categories = getLoteCategories(lote).filter(Boolean).slice(0, 2);

  const handleToggleFavorito = async () => {
    if (!lote) return;

    try {
      const res = await toggleFavorito(lote.id_lote, lote.isFavorito ?? false);

      lote.isFavorito = res.favorito;
      lote.total_favoritos = res.total_favoritos;

      forceUpdate((prev) => prev + 1);
    } catch (error) {
      console.log("Error favorito:", error);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.93}
      style={styles.relatedCard}
      onPress={() =>
        navigation.navigate("Home", {
          screen: "LoteDetail",
          params: { id: lote.id_lote },
        })
      }
    >
      <View style={styles.relatedImageWrap}>
        <Image source={{ uri: imageUri }} style={styles.relatedImage} />

        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.relatedFavorite}
          onPress={(event) => {
            event.stopPropagation();
            handleToggleFavorito();
          }}
        >
          <View style={styles.relatedFavoriteContent}>
            <Ionicons
              name={isFavorito ? "heart" : "heart-outline"}
              size={16}
              color={isFavorito ? "red" : "white"}
            />
            <Text style={styles.relatedFavoriteText}>{totalFavoritos}</Text>
          </View>
        </TouchableOpacity>

        {locationLabel && (
          <View style={styles.relatedLocationBadge}>
            <Ionicons name="location-outline" size={12} color={colors.white} />
            <Text style={styles.relatedLocationText} numberOfLines={1}>
              {locationLabel}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.relatedInfo}>
        <Text style={styles.relatedTitle} numberOfLines={2}>
          {lote.titulo}
        </Text>

        <View style={styles.relatedMetaRow}>
          <Text style={styles.relatedUnits} numberOfLines={1}>
            {lote.cantidad} unidades
          </Text>
          <Text style={styles.relatedPrice}>{lote.precio} EUR</Text>
        </View>

        {categories.length > 0 && (
          <View style={styles.relatedCategoryRow}>
            {categories.map((category) => (
              <View key={category} style={styles.relatedCategoryPill}>
                <Text style={styles.relatedCategoryText} numberOfLines={1}>
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

export default function LoteDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const { id } = route.params;

  const [lote, setLote] = useState<Lote | null>(null);
  const [vendedor, setVendedor] = useState<any>(null);
  const [resumenVendedor, setResumenVendedor] = useState({
    media: 0,
    total: 0,
  });
  const [imagenActual, setImagenActual] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [lotesUsuario, setLotesUsuario] = useState<Lote[]>([]);
  const [lotesSimilares, setLotesSimilares] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(false);

  const scale = useRef(new Animated.Value(1)).current;
  const galleryRef = useRef<FlatList<any> | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const modalGalleryRef = useRef<FlatList<any> | null>(null);
  const scrollStartX = useRef<number | null>(null);
  const isDragging = useRef(false);
  const isProgrammaticScroll = useRef(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const galleryWidth = screenWidth - spacing.lg * 2;
  const dotSize = 8;
  const dotMargin = spacing.xs;
  const dotSpacing = dotSize + dotMargin * 2;
  const activeDotWidth = 18;
  const activeDotOffset = dotMargin - (activeDotWidth - dotSize) / 2;
  const currentUser = user as { id?: number; id_usuario?: number } | null;
  const currentUserId = currentUser?.id ?? currentUser?.id_usuario;
  const [isFavorito, setIsFavorito] = useState(false);
  const [totalFavoritos, setTotalFavoritos] = useState(0);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const onPinchEvent = Animated.event([{ nativeEvent: { scale } }], {
    useNativeDriver: true,
  });

  const onPinchStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  useEffect(() => {
    if (fullscreen && modalGalleryRef.current) {
      modalGalleryRef.current.scrollToIndex({
        index: imagenActual,
        animated: false,
      });
    }
  }, [fullscreen, imagenActual]);

  useEffect(() => {
    if (!fullscreen && galleryRef.current) {
      galleryRef.current.scrollToIndex({
        index: imagenActual,
        animated: false,
      });
      scrollX.setValue(imagenActual * galleryWidth);
    }
  }, [fullscreen, imagenActual]);

  useEffect(() => {
    const fetchLote = async () => {
      setLoading(true);
      setLote(null);
      try {
        if (id) {
          const data = await getLoteById(Number(id));
          if (data) setLote(data);
        }
      } catch {
        Alert.alert("Error al cargar el lote");
      } finally {
        setLoading(false);
      }
    };

    fetchLote();
  }, [id]);

  useEffect(() => {
    const syncFavorito = async () => {
      if (!lote) return;

      try {
        const result = await checkFavorito(lote.id_lote);

        setIsFavorito(result.favorito);

        setTotalFavoritos(lote.total_favoritos ?? 0);
      } catch (error) {
        console.log("Error comprobando favorito:", error);
      }
    };

    syncFavorito();
  }, [lote?.id_lote]);

  useEffect(() => {
    setImagenActual(0);

    galleryRef.current?.scrollToOffset({
      offset: 0,
      animated: false,
    });

    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: 0,
        animated: false,
      });
    }, 50);
  }, [id]);

  useEffect(() => {
    const fetchUser = async () => {
      if (lote?.id_vendedor) {
        try {
          const data = await getUserById(lote.id_vendedor);

          setVendedor(data);
        } catch (error) {
          console.log("Error cargando vendedor", error);
        }
      }
    };

    fetchUser();
  }, [lote]);
  useEffect(() => {
    const fetchRating = async () => {
      if (!lote?.id_vendedor) return;

      try {
        const resumen = await getResumenCalificaciones(lote.id_vendedor);

        setResumenVendedor({
          media: resumen.media,
          total: resumen.total,
        });
      } catch (error) {
        console.log("Error cargando valoración", error);
      }
    };

    fetchRating();
  }, [lote]);

  useEffect(() => {
    const fetchUserLotes = async () => {
      if (lote?.id_vendedor) {
        const data = await getLotesByUser(lote.id_vendedor);
        const filtrados = data.filter((l: Lote) => l.id_lote !== lote.id_lote);
        setLotesUsuario(filtrados.slice(0, 8));
      }
    };

    fetchUserLotes();
  }, [lote]);

  useEffect(() => {
    const fetchSimilarLotes = async () => {
      if (!lote) return;

      try {
        const currentCategories = getLoteCategories(lote).filter(Boolean);

        if (currentCategories.length === 0) {
          setLotesSimilares([]);
          return;
        }

        const data = await getLotes();
        const similares = data
          .filter((item) => item.id_lote !== lote.id_lote)
          .filter((item) => {
            const itemCategories = getLoteCategories(item).filter(Boolean);

            return itemCategories.some((category) =>
              currentCategories.includes(category),
            );
          })
          .slice(0, 8);

        setLotesSimilares(similares);
      } catch (error) {
        console.log("Error cargando lotes similares", error);
      }
    };

    fetchSimilarLotes();
  }, [lote]);

  const handleDelete = async () => {
    if (!lote) return;

    Alert.alert("Eliminar lote", "Desea eliminar el lote permanentemente?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteLote(lote.id_lote);

            navigation.reset({
              index: 0,
              routes: [
                {
                  name: "Home",
                  params: {
                    screen: "HomeScreen",
                  },
                },
              ],
            });
          } catch {
            Alert.alert("Error", "No se pudo eliminar el lote");
          }
        },
      },
    ]);
  };
  const handleContactSeller = async () => {
    if (!lote || !currentUserId) return;

    if (lote.id_vendedor === currentUserId) {
      Alert.alert("Este lote es tuyo", "No puedes contactarte a ti mismo.");
      return;
    }

    try {
      setContacting(true);
      navigation.navigate("Chat", {
        buyerId: currentUserId,
        sellerId: lote.id_vendedor,
        otherUserId: lote.id_vendedor,
        loteId: lote.id_lote,
        loteTitulo: lote.titulo,
        otherUserName: vendedor?.nombre || nombreVendedor,
      });
    } catch {
      Alert.alert("Error", "No se pudo abrir la conversacion");
    } finally {
      setContacting(false);
    }
  };
  const handleToggleFavorito = async () => {
    if (!lote || favoriteLoading) return;

    try {
      setFavoriteLoading(true);

      const previousFavorito = isFavorito;
      const previousTotal = totalFavoritos;

      const optimisticFavorito = !previousFavorito;

      setIsFavorito(optimisticFavorito);
      setTotalFavoritos((prev) =>
        optimisticFavorito ? prev + 1 : Math.max(0, prev - 1),
      );

      const res = await toggleFavorito(lote.id_lote, previousFavorito);

      setIsFavorito(res.favorito);
      setTotalFavoritos(res.total_favoritos);

      setLote((prev) =>
        prev
          ? {
              ...prev,
              isFavorito: res.favorito,
              total_favoritos: res.total_favoritos,
            }
          : prev,
      );
    } catch (error) {
      console.log("Error favorito:", error);

      setIsFavorito(lote.isFavorito ?? false);
      setTotalFavoritos(lote.total_favoritos ?? 0);
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={layoutStyles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.feedbackTitle}>Cargando detalle del lote...</Text>
      </View>
    );
  }

  if (!lote) {
    return (
      <View style={layoutStyles.center}>
        <Text style={styles.feedbackTitle}>Lote no disponible</Text>
        <Text style={styles.feedbackText}>
          Intentalo de nuevo en unos segundos.
        </Text>
      </View>
    );
  }

  const imagenes = Array.isArray(lote.imagenes) ? lote.imagenes : [];
  const activeDotTranslateX = scrollX.interpolate({
    inputRange: [0, galleryWidth * Math.max(1, imagenes.length - 1)],
    outputRange: [
      activeDotOffset,
      activeDotOffset + dotSpacing * Math.max(1, imagenes.length - 1),
    ],
    extrapolate: "clamp",
  });
  const imageSources =
    imagenes.length > 0 ? imagenes : ["https://via.placeholder.com/300"];
  const categorias = getLoteCategories(lote);
  const nombreVendedor =
    typeof vendedor?.nombre === "string"
      ? vendedor.nombre
      : typeof lote.vendedor === "string"
        ? lote.vendedor
        : typeof lote.vendedor === "object" && lote.vendedor !== null
          ? (lote.vendedor as any).nombre
          : "Usuario";
  const vendedorAvatar = vendedor?.avatar
    ? vendedor.avatar.startsWith("http")
      ? getImageUrl(vendedor.avatar)
      : API_URL + vendedor.avatar
    : null;
  const locationLabel = formatLoteLocation(lote);
  const hasMapLocation =
    typeof lote.latitud === "number" && typeof lote.longitud === "number";
  const mapCoordinate = hasMapLocation
    ? {
        latitude: lote.latitud as number,
        longitude: lote.longitud as number,
      }
    : null;

  return (
    <ScrollView
      ref={scrollViewRef}
      style={layoutStyles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarBrand}>LOTEA</Text>
        <View style={{ width: 22 }} />
      </View>

      {currentUserId && lote.id_vendedor === currentUserId && (
        <View style={styles.ownerActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() =>
              navigation.navigate("Home", {
                screen: "EditLote",
                params: { id: lote.id_lote },
              })
            }
            activeOpacity={0.85}
          >
            <View style={styles.actionButtonContent}>
              <Ionicons
                name="pencil-outline"
                size={26}
                color={colors.primary}
              />
              <Text style={styles.actionButtonText}>Editar</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
            activeOpacity={0.85}
          >
            <View style={styles.actionButtonContent}>
              <Ionicons name="trash-outline" size={24} color={colors.white} />
              <Text style={[styles.actionButtonText, { color: colors.white }]}>
                Eliminar
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.galleryContainer}>
        <AnimatedFlatList
          ref={galleryRef}
          data={imageSources}
          horizontal
          pagingEnabled
          nestedScrollEnabled
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          style={{ width: galleryWidth }}
          contentContainerStyle={{ alignItems: "center" }}
          keyExtractor={(_, index) => index.toString()}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
          onScrollBeginDrag={(e) => {
            isDragging.current = true;
            scrollStartX.current = e.nativeEvent.contentOffset.x;
          }}
          onScrollEndDrag={(e) => {
            isDragging.current = false;
            const endX = e.nativeEvent.contentOffset.x;
            const startX = scrollStartX.current ?? 0;
            const dx = endX - startX;
            const threshold = galleryWidth * 0.12;
            let newIndex = imagenActual;

            if (Math.abs(dx) > threshold) {
              // swipe left -> dx > 0 (moved to the right) -> next image
              if (dx > 0)
                newIndex = Math.min(imagenes.length - 1, imagenActual + 1);
              else newIndex = Math.max(0, imagenActual - 1);
            } else {
              // small drag -> snap back to current
              newIndex = imagenActual;
            }

            // mark programmatic scroll to avoid conflicting momentum updates
            isProgrammaticScroll.current = true;
            galleryRef.current?.scrollToOffset({
              offset: newIndex * galleryWidth,
              animated: true,
            });
            setImagenActual(newIndex);
          }}
          onMomentumScrollEnd={(e) => {
            // if we initiated the scroll programmatically, just clear flag
            const index = Math.round(
              e.nativeEvent.contentOffset.x / galleryWidth,
            );
            if (isProgrammaticScroll.current) {
              isProgrammaticScroll.current = false;
              setImagenActual(index);
              return;
            }

            // user-driven momentum: update index
            setImagenActual(index);
          }}
          renderItem={({ item }) => {
            const uri =
              typeof item === "string" && item.startsWith("http")
                ? item
                : getImageUrl(item as string | null);
            return (
              <View style={[styles.mainImageWrapper, { width: galleryWidth }]}>
                <TouchableOpacity
                  activeOpacity={0.95}
                  onPress={() => setFullscreen(true)}
                  style={styles.mainImageTouchable}
                >
                  <Image source={{ uri }} style={styles.mainImage} />
                  <View style={styles.imageOverlay}></View>
                </TouchableOpacity>
              </View>
            );
          }}
        />

        {imagenes.length > 0 && (
          <View style={styles.galleryDotsContainer}>
            <View style={styles.galleryDotsTrack}>
              <Animated.View
                style={[
                  styles.galleryActiveDot,
                  {
                    width: activeDotWidth,
                    transform: [{ translateX: activeDotTranslateX }],
                  },
                ]}
              />
              {imagenes.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.85}
                  onPress={() => {
                    setImagenActual(index);
                    galleryRef.current?.scrollToIndex({
                      index,
                      animated: true,
                    });
                  }}
                  style={{ marginHorizontal: spacing.xs }}
                >
                  <View style={styles.galleryDot} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      <Card>
        <View style={styles.summaryBlock}>
          <Text style={styles.title}>{lote.titulo}</Text>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.favoriteRow}
            onPress={handleToggleFavorito}
          >
            <Ionicons
              name={isFavorito ? "heart" : "heart-outline"}
              size={28}
              color={isFavorito ? colors.primary : colors.primary}
            />

            <Text style={styles.favoriteText}>{totalFavoritos} favoritos</Text>
          </TouchableOpacity>

          <View style={styles.stockPriceRow}>
            <Text style={styles.stockText}>
              Quedan {lote.cantidad} unidades
            </Text>

            <Text style={styles.price}>{lote.precio} EUR</Text>
          </View>
        </View>

        {locationLabel && (
          <View style={styles.locationPanel}>
            <View style={styles.locationIcon}>
              <Ionicons
                name="location-outline"
                size={18}
                color={colors.primary}
              />
            </View>
            <View style={styles.locationCopy}>
              <Text style={styles.locationTitle}>Ubicacion aproximada</Text>
              <Text style={styles.locationText}>{locationLabel}</Text>
            </View>
          </View>
        )}

        {mapCoordinate && (
          <View style={styles.detailMapWrap}>
            <MapView
              style={styles.detailMap}
              initialRegion={{
                ...mapCoordinate,
                latitudeDelta: 0.04,
                longitudeDelta: 0.04,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
            >
              <Circle
                center={mapCoordinate}
                radius={APPROXIMATION_RADIUS_METERS}
                fillColor="rgba(59,130,246,0.16)"
                strokeColor="rgba(59,130,246,0.55)"
                strokeWidth={2}
              />
              <Marker coordinate={mapCoordinate} />
            </MapView>
            <View style={styles.mapCaption}>
              <Ionicons
                name="shield-checkmark-outline"
                size={14}
                color={colors.accent}
              />
              <Text style={styles.mapCaptionText}>
                Zona aproximada del lote
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.sellerRow}
          activeOpacity={0.9}
          onPress={() =>
            navigation.navigate("Home", {
              screen: "UserProfile",
              params: { id: lote.id_vendedor },
            })
          }
        >
          <Avatar
            uri={vendedorAvatar}
            name={vendedor?.nombre || nombreVendedor}
            size={48}
          />
          <View style={styles.sellerCopy}>
            <Text style={styles.sellerName}>
              {vendedor?.nombre || nombreVendedor}
            </Text>

            <RatingStars
              value={resumenVendedor.media}
              total={resumenVendedor.total}
              showValue
              size={14}
              style={styles.sellerRating}
            />

            <Text style={styles.sellerLink}>Ver perfil del vendedor</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.subtext} />
        </TouchableOpacity>
      </Card>

      <Card>
        <Text style={styles.descriptionTitle}>Descripcion</Text>
        <Text style={styles.description}>{lote.descripcion}</Text>
      </Card>

      {categorias.length > 0 && (
        <View style={styles.categoriesSection}>
          <View style={styles.categoriesHeader}>
            <View style={styles.categoriesIcon}>
              <Ionicons
                name="pricetags-outline"
                size={16}
                color={colors.primary}
              />
            </View>
            <Text style={styles.categoriesTitle}>Categorías</Text>
          </View>
          <View style={styles.categoriesGrid}>
            {categorias.map((categoria) => (
              <View key={categoria} style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{categoria}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {lotesUsuario.length > 0 && (
        <View style={styles.moreSection}>
          <View style={styles.marketSectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons
                name="storefront-outline"
                size={16}
                color={colors.primary}
              />
            </View>
            <View style={styles.sectionHeaderCopy}>
              <Text style={styles.sectionTitle}>Mas de este vendedor</Text>
              <Text style={styles.sectionSubtitle}>
                Otras oportunidades publicadas por {nombreVendedor}.
              </Text>
            </View>
          </View>

          <FlatList
            data={lotesUsuario}
            horizontal
            keyExtractor={(item) => item.id_lote.toString()}
            renderItem={({ item }) => (
              <View style={styles.relatedItem}>
                <RelatedLoteCard lote={item} />
              </View>
            )}
            contentContainerStyle={styles.moreList}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      {lotesSimilares.length > 0 && (
        <View style={styles.moreSection}>
          <View style={styles.marketSectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons
                name="albums-outline"
                size={16}
                color={colors.primary}
              />
            </View>
            <View style={styles.sectionHeaderCopy}>
              <Text style={styles.sectionTitle}>Mas como este</Text>
              <Text style={styles.sectionSubtitle}>
                Lotes con categorias parecidas a este producto.
              </Text>
            </View>
          </View>

          <FlatList
            data={lotesSimilares}
            horizontal
            keyExtractor={(item) => item.id_lote.toString()}
            renderItem={({ item }) => (
              <View style={styles.relatedItem}>
                <RelatedLoteCard lote={item} />
              </View>
            )}
            contentContainerStyle={styles.moreList}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      <View style={styles.buttonsContainer}>
        {currentUserId && lote.id_vendedor !== currentUserId && (
          <TouchableOpacity
            style={styles.buyButton}
            onPress={() =>
              navigation.navigate("Compra", {
                lote,
              })
            }
            activeOpacity={0.85}
          >
            <View style={styles.buyButtonContent}>
              <Ionicons
                name="bag-check-outline"
                size={24}
                color={colors.white}
              />
              <Text style={styles.buyButtonText}>Comprar lote</Text>
            </View>
          </TouchableOpacity>
        )}

        {currentUserId && lote.id_vendedor !== currentUserId && (
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContactSeller}
            disabled={contacting}
            activeOpacity={0.85}
          >
            <View style={styles.contactButtonContent}>
              <Ionicons
                name="chatbox-outline"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.contactButtonText}>
                {contacting ? "Abriendo chat..." : "Contactar con vendedor"}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={fullscreen} transparent animationType="fade">
        <View style={styles.modal}>
          <View style={styles.topModalBar}>
            <Text style={styles.counter}>
              {Math.max(1, imagenActual + 1)} / {imagenes.length}
            </Text>

            <TouchableOpacity onPress={() => setFullscreen(false)}>
              <Text style={styles.closeText}>X</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            ref={modalGalleryRef}
            data={imagenes}
            initialScrollIndex={imagenActual}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => i.toString()}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x /
                  e.nativeEvent.layoutMeasurement.width,
              );
              setImagenActual(index);
            }}
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
            renderItem={({ item }) => (
              <View style={styles.fullImageContainer}>
                <PinchGestureHandler
                  onGestureEvent={onPinchEvent}
                  onHandlerStateChange={onPinchStateChange}
                >
                  <Animated.Image
                    source={{ uri: getImageUrl(item) }}
                    style={[styles.fullImage, { transform: [{ scale }] }]}
                  />
                </PinchGestureHandler>
              </View>
            )}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#EFF6FF",
  },
  topBarBrand: {
    ...typography.heading,
    color: colors.primary,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  ownerActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#E0ECFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  actionButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: radii.md,
    fontWeight: "800",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  actionButtonText: {
    ...typography.bodyStrong,
    color: colors.primary,
    fontWeight: "800",
    paddingTop: 2,
    fontSize: 20,
  },
  editButton: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  deleteButton: {
    backgroundColor: colors.danger,
  },
  galleryContainer: {
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E0ECFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    marginBottom: spacing.lg,
  },
  mainImageWrapper: {
    width: "100%",
    position: "relative",
  },
  mainImageTouchable: {
    flex: 1,
    position: "relative",
  },
  mainImage: {
    width: "100%",
    height: 300,
    backgroundColor: "#F3F4F6",
    resizeMode: "cover",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    padding: spacing.lg,
  },
  zoomBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
  },
  zoomText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  galleryDotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  galleryDotsTrack: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  galleryActiveDot: {
    position: "absolute",
    left: 0,
    width: 18,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1,
  },
  galleryDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: "#E5E7EB",
  },
  summaryCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  summaryBlock: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#EFF6FF",
  },
  title: {
    ...typography.title,
    color: colors.text,
    fontWeight: "800",
    fontSize: 22,
    lineHeight: 28,
  },
  price: {
    ...typography.heading,
    color: colors.accent,
    fontWeight: "900",
    fontSize: 24,
  },
  sellerRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  sellerCopy: {
    flex: 1,
    gap: 2,
  },
  sellerName: {
    ...typography.bodyStrong,
    color: colors.text,
    fontWeight: "700",
  },
  sellerLink: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
  locationPanel: {
    marginTop: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#E0ECFF",
    backgroundColor: "#F0F9FF",
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  locationCopy: {
    flex: 1,
    gap: 2,
  },
  locationTitle: {
    ...typography.bodyStrong,
    color: colors.text,
    fontWeight: "700",
  },
  locationText: {
    ...typography.caption,
    color: colors.subtext,
  },
  detailMapWrap: {
    height: 200,
    marginTop: spacing.md,
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#E0ECFF",
    backgroundColor: "#E5E7EB",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  detailMap: {
    flex: 1,
  },
  mapCaption: {
    position: "absolute",
    left: spacing.md,
    bottom: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: "#E0ECFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  mapCaptionText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: "700",
  },
  descriptionTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.md,
    fontWeight: "800",
    fontSize: 18,
  },
  description: {
    ...typography.body,
    color: colors.subtext,
    lineHeight: 22,
  },
  categoriesSection: {
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: "#F0F9FF",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#E0ECFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  categoriesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  categoriesIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  categoriesTitle: {
    ...typography.bodyStrong,
    color: colors.text,
    fontWeight: "800",
    fontSize: 16,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryPillText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  moreSection: {
    gap: spacing.md,
    paddingTop: spacing.xxs,
    paddingBottom: spacing.xxs,
  },
  marketSectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    color: colors.text,
    fontWeight: "800",
    fontSize: 16,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.subtext,
    marginTop: spacing.xs,
  },
  moreList: {
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  relatedItem: {
    width: 236,
  },
  relatedCard: {
    width: 236,
    height: 302,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E0ECFF",
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  relatedImageWrap: {
    height: 154,
    backgroundColor: "#E5E7EB",
    position: "relative",
  },
  relatedImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  relatedFavorite: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.42)",
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: radii.full,
    zIndex: 5,
  },
  relatedFavoriteText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: "600",
  },
  relatedFavoriteContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  relatedLocationBadge: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    minHeight: 30,
    borderRadius: radii.full,
    backgroundColor: "rgba(17,24,39,0.65)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    gap: spacing.xxs,
  },
  relatedLocationText: {
    ...typography.caption,
    color: colors.white,
    flex: 1,
    fontWeight: "600",
  },
  relatedInfo: {
    height: 138,
    padding: spacing.md,
    gap: spacing.sm,
  },
  relatedTitle: {
    ...typography.bodyStrong,
    color: colors.text,
    minHeight: 44,
    fontWeight: "700",
    fontSize: 14,
    lineHeight: 20,
  },
  relatedMetaRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "#EFF6FF",
  },
  relatedUnits: {
    ...typography.caption,
    color: colors.subtext,
    flex: 1,
    fontWeight: "600",
  },
  relatedPrice: {
    ...typography.bodyStrong,
    color: colors.accent,
    fontWeight: "800",
    fontSize: 15,
  },
  relatedCategoryRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  relatedCategoryPill: {
    flex: 1,
    minHeight: 26,
    borderRadius: radii.full,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
    borderWidth: 0.5,
    borderColor: "#DBEAFE",
  },
  relatedCategoryText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
    fontSize: 11,
  },
  buttonsContainer: {
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingBottom: spacing.xxs,
  },
  buyButton: {
    minHeight: 68,
    borderRadius: radii.lg,

    backgroundColor: "#3B82F6",
    borderWidth: 1,
    borderColor: "#60A5FA",

    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 8,
  },
  buyButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  buyButtonText: {
    ...typography.bodyStrong,
    color: colors.white,
    fontWeight: "900",
    fontSize: 18,
    lineHeight: 24,
    paddingTop: 5,
  },
  contactButton: {
    minHeight: 68,
    borderRadius: radii.lg,

    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",

    justifyContent: "center",
    alignItems: "center",

    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  contactButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  contactButtonText: {
    ...typography.bodyStrong,
    color: colors.primary,
    fontWeight: "800",
    fontSize: 17,
    lineHeight: 23,
  },
  modal: {
    flex: 1,
    backgroundColor: "#020617",
  },
  topModalBar: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 2,
  },
  counter: {
    ...typography.bodyStrong,
    color: colors.white,
  },
  closeText: {
    color: colors.white,
    fontSize: 22,
  },
  fullImageContainer: {
    width: screenWidth,
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "100%",
    height: "80%",
    resizeMode: "contain",
  },
  feedbackTitle: {
    ...typography.heading,
    color: colors.text,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  feedbackText: {
    ...typography.body,
    color: colors.subtext,
    textAlign: "center",
    marginTop: spacing.xs,
  },

  sellerRating: {
    marginTop: 2,
  },
  favoriteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  favoriteText: {
    ...typography.bodyStrong,
    color: colors.subtext,
    fontSize: 17,
  },

  stockPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  stockText: {
    ...typography.caption,
    color: colors.subtext,
    fontWeight: "600",
  },
});
