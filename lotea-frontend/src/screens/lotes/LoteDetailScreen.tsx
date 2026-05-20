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
import { toggleFavorito } from "../../services/favoritosService";

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
        <View style={styles.relatedImageShade} />

        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.relatedFavorite}
          onPress={(event) => {
            event.stopPropagation();
            handleToggleFavorito();
          }}
        >
          <Ionicons
            name={isFavorito ? "heart" : "heart-outline"}
            size={17}
            color={isFavorito ? colors.danger : colors.text}
          />
          <Text style={styles.relatedFavoriteText}>{totalFavoritos}</Text>
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
  const [imagenActual, setImagenActual] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [lotesUsuario, setLotesUsuario] = useState<Lote[]>([]);
  const [lotesSimilares, setLotesSimilares] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(false);

  const scale = useRef(new Animated.Value(1)).current;
  const currentUser = user as { id?: number; id_usuario?: number } | null;
  const currentUserId = currentUser?.id ?? currentUser?.id_usuario;

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
    const fetchLote = async () => {
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

            await deleteLote(lote.id_lote);

            navigation.navigate("Home", {
              screen: "HomeScreen",
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
        <TouchableOpacity activeOpacity={0.8}>
          <Ionicons name="settings-outline" size={18} color={colors.subtext} />
        </TouchableOpacity>
      </View>

      {currentUserId && lote.id_vendedor === currentUserId && (
        <View style={styles.ownerActions}>
          <Button
            title="Eliminar"
            variant="danger"
            onPress={handleDelete}
            style={styles.actionButton}
          />
          <Button
            title="Editar"
            variant="secondary"
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate("Home", {
                screen: "EditLote",
                params: { id: lote.id_lote },
              })
            }
          />
        </View>
      )}

      <Card contentStyle={styles.galleryCardContent}>
        <TouchableOpacity
          activeOpacity={0.96}
          onPress={() => setFullscreen(true)}
        >
          <Image
            source={{
              uri: imagenes[imagenActual]
                ? getImageUrl(imagenes[imagenActual])
                : "https://via.placeholder.com/300",
            }}
            style={styles.mainImage}
          />
        </TouchableOpacity>

        {imagenes.length > 0 && (
          <View style={styles.galleryDots}>
            {imagenes.map((_, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                onPress={() => setImagenActual(index)}
                style={[
                  styles.galleryDot,
                  imagenActual === index && styles.galleryDotActive,
                ]}
              />
            ))}
          </View>
        )}
      </Card>

      <Card>
        <View style={styles.summaryHeader}>
          <View style={styles.summaryCopy}>
            <Text style={styles.title}>{lote.titulo}</Text>
            <Text style={styles.ratingLine}>
              Quedan {lote.cantidad} unidades
            </Text>
          </View>
          <Text style={styles.price}>{lote.precio} EUR</Text>
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
        <View style={styles.categoriesRow}>
          {categorias.map((categoria) => (
            <View key={categoria} style={componentStyles.pill}>
              <Text style={componentStyles.pillText}>{categoria}</Text>
            </View>
          ))}
        </View>
      )}

      {lotesUsuario.length > 0 && (
        <View style={styles.moreSection}>
          <View style={styles.marketSectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="storefront-outline" size={16} color={colors.primary} />
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
              <Ionicons name="albums-outline" size={16} color={colors.primary} />
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

      <Button
        title="Comprar lote"
        variant="primary"
        style={styles.buyButton}
        onPress={() =>
          navigation.navigate("Compra", {
            lote,
          })
        }
      />

      {currentUserId && lote.id_vendedor !== currentUserId && (
        <Button
          title={contacting ? "Abriendo chat..." : "Contactar con vendedor"}
          variant="secondary"
          style={styles.contactButton}
          onPress={handleContactSeller}
          disabled={contacting}
        />
      )}

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
            data={imagenes}
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
  },
  topBarBrand: {
    ...typography.heading,
    color: colors.primary,
  },
  ownerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  galleryCardContent: {
    padding: spacing.sm,
    gap: spacing.md,
  },
  mainImage: {
    width: "100%",
    height: 250,
    borderRadius: radii.lg,
  },
  galleryDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
  },
  galleryDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: "#D1D5DB",
  },
  galleryDotActive: {
    width: 22,
    backgroundColor: colors.primary,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  summaryCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  ratingLine: {
    ...typography.caption,
    color: colors.subtext,
  },
  price: {
    ...typography.title,
    color: colors.accent,
  },
  sellerRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  sellerCopy: {
    flex: 1,
    gap: 2,
  },
  sellerName: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  sellerLink: {
    ...typography.caption,
    color: colors.primary,
  },
  locationPanel: {
    marginTop: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F8FAFC",
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  locationCopy: {
    flex: 1,
    gap: 2,
  },
  locationTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  locationText: {
    ...typography.caption,
    color: colors.subtext,
  },
  detailMapWrap: {
    height: 190,
    marginTop: spacing.md,
    borderRadius: radii.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#E5E7EB",
  },
  detailMap: {
    flex: 1,
  },
  mapCaption: {
    position: "absolute",
    left: spacing.sm,
    bottom: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapCaptionText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: "700",
  },
  descriptionTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body,
    color: colors.subtext,
  },
  categoriesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  moreSection: {
    gap: spacing.sm,
  },
  marketSectionHeader: {
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
  sectionHeaderCopy: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.subtext,
  },
  moreList: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  relatedItem: {
    width: 236,
  },
  relatedCard: {
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
  relatedImageShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 58,
    backgroundColor: "rgba(17,24,39,0.18)",
  },
  relatedFavorite: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    minWidth: 48,
    height: 34,
    borderRadius: radii.full,
    backgroundColor: "rgba(255,255,255,0.92)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: spacing.xs,
  },
  relatedFavoriteText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "700",
  },
  relatedLocationBadge: {
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
  relatedLocationText: {
    ...typography.caption,
    color: colors.white,
    flex: 1,
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
  },
  relatedMetaRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  relatedUnits: {
    ...typography.caption,
    color: colors.subtext,
    flex: 1,
  },
  relatedPrice: {
    ...typography.bodyStrong,
    color: colors.accent,
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
  },
  relatedCategoryText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
  },
  buyButton: {
    minHeight: 58,
    borderRadius: radii.lg,
  },
  contactButton: {
    minHeight: 58,
    borderRadius: radii.lg,
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
});
