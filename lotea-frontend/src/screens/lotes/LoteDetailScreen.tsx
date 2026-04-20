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

import {
  getLoteById,
  deleteLote,
  getLotesByUser,
} from "../../services/lotesService";
import { getUserById } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import type { Lote } from "../../types/Lote";
import LoteCard from "../../components/lotes/LoteCard";
import Avatar from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { colors } from "../../styles/colors";
import { componentStyles, layoutStyles } from "../../styles/theme";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://192.168.0.65:3000";
const screenWidth = Dimensions.get("window").width;

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
  const [loading, setLoading] = useState(true);

  const scale = useRef(new Animated.Value(1)).current;

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

  const fixUrl = (url: string) =>
    url.replace("http://localhost:3000", BASE_URL);

  useEffect(() => {
    const fetchLote = async () => {
      try {
        if (id) {
          const data = await getLoteById(Number(id));
          if (data) setLote(data);
        }
      } catch (error) {
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
        setLotesUsuario(filtrados.slice(0, 4));
      }
    };

    fetchUserLotes();
  }, [lote]);

  const handleDelete = async () => {
    if (!lote) return;

    Alert.alert("Eliminar lote", "¿Desea eliminar el lote permanentemente?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await deleteLote(lote.id_lote);
          navigation.goBack();
        },
      },
    ]);
  };
  // pedidos
  const handleBuy = async () => {
    if (!lote) return;

    try {
      const token = await AsyncStorage.getItem("token");

      await axios.post(
        `${BASE_URL}/pedidos`,
        {
          id_lote: lote.id_lote,
          cantidad: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      Alert.alert("Compra realizada", "Pedido creado correctamente");
    } catch (error: any) {
      console.log(error);

      if (error.response?.data?.message) {
        Alert.alert("Error", error.response.data.message);
      } else {
        Alert.alert("Error", "No se pudo completar la compra");
      }
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

  const imagenes = lote.imagenes || [];
  const vendedorAvatar = vendedor?.avatar
    ? vendedor.avatar.startsWith("http")
      ? vendedor.avatar
      : BASE_URL + vendedor.avatar
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

      {user && lote.id_vendedor === user.id && (
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
              uri: imagenes[imagenActual]?.url
                ? fixUrl(imagenes[imagenActual].url)
                : "https://picsum.photos/600",
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
            name={vendedor?.nombre || lote.vendedor}
            size={48}
          />
          <View style={styles.sellerCopy}>
            <Text style={styles.sellerName}>
              {vendedor?.nombre || lote.vendedor}
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

      {lote.categoria && (
        <View style={componentStyles.pill}>
          <Text style={componentStyles.pillText}>{lote.categoria}</Text>
        </View>
      )}

      {lotesUsuario.length > 0 && (
        <View style={styles.moreSection}>
          <View style={layoutStyles.pageHeader}>
            <Text style={layoutStyles.headerEyebrow}>Mas de este vendedor</Text>
            <Text style={styles.sectionTitle}>Otros lotes relacionados</Text>
          </View>

          <FlatList
            data={lotesUsuario}
            horizontal
            keyExtractor={(item) => item.id_lote.toString()}
            renderItem={({ item }) => <LoteCard lote={item} />}
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
                    source={{ uri: fixUrl(item.url) }}
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
  descriptionTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body,
    color: colors.subtext,
  },
  moreSection: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.title,
    color: colors.text,
  },
  moreList: {
    gap: spacing.sm,
  },
  buyButton: {
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
