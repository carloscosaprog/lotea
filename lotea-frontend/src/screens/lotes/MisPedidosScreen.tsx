import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import Avatar from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PrimaryActionButton from "../../components/ui/PrimaryActionButton";
import RatingStars from "../../components/ui/RatingStars";
import { createCalificacion } from "../../services/calificacionesService";
import { getPedidos } from "../../services/pedidosService";
import { colors } from "../../styles/colors";
import { layoutStyles } from "../../styles/theme";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";
import type { Calificacion } from "../../types/Calificacion";
import type { Pedido } from "../../types/Pedido";
import { getImageUrl } from "../../utils/getImageUrl";

const estadoLabels: Record<string, string> = {
  pendiente_pago: "Pendiente de pago",
  pagado: "Pago confirmado",
  preparando: "Preparando",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const estadoColors: Record<string, string> = {
  pendiente_pago: colors.warning,
  pagado: colors.primary,
  preparando: colors.primary,
  enviado: colors.accent,
  entregado: colors.accent,
  cancelado: colors.danger,
};

const formatCurrency = (value: number) => `${value.toFixed(2)} EUR`;

const getPedidoResumen = (pedido: Pedido) => {
  const detalle = pedido.detalles[0];
  const lote = detalle?.lote;
  const subtotal = pedido.detalles.reduce(
    (sum, item) => sum + Number(item.precio_unitario) * item.cantidad,
    0,
  );
  const total = subtotal + subtotal * 0.1;

  return {
    detalle,
    lote,
    total,
    image: getImageUrl(lote?.imagenes?.[0]),
  };
};

const getApiErrorMessage = (error: any) => {
  const message = error?.response?.data?.message;

  if (Array.isArray(message)) return message[0];
  if (typeof message === "string") return message;

  return "No se pudo enviar la valoracion. Intentalo de nuevo.";
};

export default function MisPedidosScreen() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submittedReview, setSubmittedReview] = useState<Calificacion | null>(
    null,
  );
  const starScales = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(1)),
  ).current;
  const navigation = useNavigation<any>();

  const fetchPedidos = useCallback(async () => {
    try {
      setErrorMessage(null);
      const data = await getPedidos();
      setPedidos(data);
    } catch (error) {
      console.log(error);
      setErrorMessage("No se pudieron cargar tus compras.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchPedidos();
    }, [fetchPedidos]),
  );

  const openReviewModal = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setSelectedRating(0);
    setComment("");
    setReviewError(null);
    setSubmittedReview(null);
  };

  const closeReviewModal = () => {
    setSelectedPedido(null);
    setSelectedRating(0);
    setComment("");
    setReviewError(null);
    setSubmittedReview(null);
  };

  const handleSelectRating = (rating: number) => {
    setSelectedRating(rating);
    setReviewError(null);

    Animated.sequence([
      Animated.timing(starScales[rating - 1], {
        toValue: 1.18,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(starScales[rating - 1], {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSubmitReview = async () => {
    if (!selectedPedido) return;

    if (!selectedRating) {
      setReviewError("Selecciona una puntuacion para continuar.");
      return;
    }

    try {
      setSubmittingReview(true);
      setReviewError(null);

      const calificacion = await createCalificacion({
        id_pedido: selectedPedido.id_pedido,
        puntuacion: selectedRating,
        comentario: comment.trim() || undefined,
      });

      setPedidos((current) =>
        current.map((pedido) =>
          pedido.id_pedido === selectedPedido.id_pedido
            ? { ...pedido, calificacion }
            : pedido,
        ),
      );
      setSubmittedReview(calificacion);
    } catch (error) {
      console.log(error);
      setReviewError(getApiErrorMessage(error));
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <View style={layoutStyles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando tus compras...</Text>
      </View>
    );
  }

  return (
    <View style={layoutStyles.screen}>
      <FlatList
        data={pedidos}
        keyExtractor={(item) => item.id_pedido.toString()}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <View style={styles.topBar}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="chevron-back" size={22} color={colors.text} />
              </TouchableOpacity>

              <Text style={styles.topBarTitle}>Mis compras</Text>

              <View style={{ width: 22 }} />
            </View>

            <View style={layoutStyles.pageHeader}>
              <Text style={layoutStyles.headerEyebrow}>Compras</Text>
              <Text style={styles.title}>Pedidos realizados</Text>
              <Text style={layoutStyles.headerSubtitle}>
                Sigue el estado de tus compras simuladas en LOTEA.
              </Text>
            </View>

            {errorMessage && (
              <View style={styles.errorBanner}>
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color={colors.danger}
                />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <Card style={{ marginHorizontal: spacing.lg }}>
            <Text style={styles.emptyTitle}>
              Aun no has realizado ningun pedido
            </Text>
            <Text style={styles.emptyText}>
              Explora lotes y completa tu primera compra simulada.
            </Text>
            <PrimaryActionButton
              title="Ver lotes"
              icon="storefront-outline"
              onPress={() => navigation.navigate("Home")}
              style={styles.emptyButton}
            />
          </Card>
        }
        renderItem={({ item }) => {
          const { detalle, lote, total, image } = getPedidoResumen(item);
          const estadoColor = estadoColors[item.estado] ?? colors.primary;
          const canReview = item.estado === "entregado" && !item.calificacion;

          return (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate("PedidoDetail", { id: item.id_pedido })
              }
            >
              <Card contentStyle={styles.cardShell}>
                <View style={styles.cardMainRow}>
                  <Image source={{ uri: image }} style={styles.thumbnail} />

                  <View style={styles.copy}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.titleItem} numberOfLines={2}>
                        {lote?.titulo ?? "Lote"}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.subtext}
                      />
                    </View>

                    <Text style={styles.subtitle}>
                      {new Date(item.fecha).toLocaleDateString()} -{" "}
                      {detalle?.cantidad ?? 0} unidades
                    </Text>

                    <View style={styles.metaRow}>
                      <Text style={styles.price}>{formatCurrency(total)}</Text>
                      <View
                        style={[
                          styles.estadoPill,
                          { backgroundColor: `${estadoColor}18` },
                        ]}
                      >
                        <Text
                          style={[styles.estadoText, { color: estadoColor }]}
                        >
                          {estadoLabels[item.estado] ?? item.estado}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {canReview && (
                  <PrimaryActionButton
                    title="Valorar vendedor"
                    icon="star-outline"
                    onPress={() => openReviewModal(item)}
                    style={styles.reviewButton}
                  />
                )}
              </Card>
            </TouchableOpacity>
          );
        }}
      />

      {selectedPedido && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={closeReviewModal}
        >
          <KeyboardAvoidingView
            style={styles.modalBackdrop}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.modalCard}>
              {submittedReview ? (
                <View style={styles.successContent}>
                  <View style={styles.successIcon}>
                    <Ionicons
                      name="checkmark"
                      size={34}
                      color={colors.accent}
                    />
                  </View>

                  <Text style={styles.modalTitle}>Gracias por tu valoracion</Text>
                  <RatingStars
                    value={submittedReview.puntuacion}
                    size={26}
                    style={styles.successStars}
                  />

                  {!!submittedReview.comentario && (
                    <Text style={styles.successComment}>
                      {submittedReview.comentario}
                    </Text>
                  )}

                  <Button
                    title="Volver a mis pedidos"
                    onPress={closeReviewModal}
                    style={styles.modalPrimaryButton}
                  />
                </View>
              ) : (
                <ScrollView
                  contentContainerStyle={styles.modalScroll}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.modalTopRow}>
                    <Text style={styles.modalTitle}>Valorar vendedor</Text>
                    <TouchableOpacity
                      onPress={closeReviewModal}
                      activeOpacity={0.8}
                      style={styles.closeButton}
                    >
                      <Ionicons name="close" size={22} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.sellerBox}>
                    <Avatar
                      uri={
                        selectedPedido.detalles[0]?.lote?.vendedor?.avatar
                          ? getImageUrl(
                              selectedPedido.detalles[0].lote.vendedor.avatar,
                            )
                          : null
                      }
                      name={selectedPedido.detalles[0]?.lote?.vendedor?.nombre}
                      size={62}
                    />

                    <View style={styles.sellerCopy}>
                      <Text style={styles.sellerName}>
                        {selectedPedido.detalles[0]?.lote?.vendedor?.nombre ??
                          "Vendedor"}
                      </Text>
                      <Text style={styles.sellerLote} numberOfLines={2}>
                        {selectedPedido.detalles[0]?.lote?.titulo ?? "Lote"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.ratingSection}>
                    <Text style={styles.inputLabel}>Puntuacion</Text>
                    <View style={styles.interactiveStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                          key={star}
                          onPress={() => handleSelectRating(star)}
                          activeOpacity={0.8}
                          style={styles.starHitbox}
                        >
                          <Animated.View
                            style={{
                              transform: [{ scale: starScales[star - 1] }],
                            }}
                          >
                            <Ionicons
                              name={selectedRating >= star ? "star" : "star-outline"}
                              size={38}
                              color={
                                selectedRating >= star
                                  ? colors.warning
                                  : "#CBD5E1"
                              }
                            />
                          </Animated.View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.inputLabel}>
                      Cuentanos tu experiencia
                    </Text>
                    <TextInput
                      value={comment}
                      onChangeText={(value) => {
                        setComment(value);
                        setReviewError(null);
                      }}
                      placeholder="Comentario opcional"
                      placeholderTextColor={colors.subtext}
                      multiline
                      maxLength={500}
                      style={styles.textarea}
                      textAlignVertical="top"
                    />
                    <Text style={styles.counter}>{comment.length}/500</Text>
                  </View>

                  {reviewError && (
                    <View style={styles.inlineError}>
                      <Ionicons
                        name="alert-circle-outline"
                        size={18}
                        color={colors.danger}
                      />
                      <Text style={styles.inlineErrorText}>{reviewError}</Text>
                    </View>
                  )}

                  <Button
                    title={
                      submittingReview ? "Enviando..." : "Enviar valoracion"
                    }
                    onPress={handleSubmitReview}
                    disabled={submittingReview}
                    style={styles.modalPrimaryButton}
                  />
                </ScrollView>
              )}
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingText: {
    ...typography.body,
    color: colors.subtext,
    marginTop: spacing.sm,
  },
  headerWrap: {
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
  cardShell: {
    marginHorizontal: spacing.lg,
    gap: spacing.md,
  },
  cardMainRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  thumbnail: {
    width: 76,
    height: 76,
    borderRadius: radii.md,
    backgroundColor: "#E5E7EB",
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
  },
  titleItem: {
    ...typography.bodyStrong,
    color: colors.text,
    flex: 1,
  },
  subtitle: {
    ...typography.caption,
    color: colors.subtext,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  price: {
    ...typography.heading,
    color: colors.accent,
  },
  estadoPill: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  estadoText: {
    ...typography.caption,
    fontWeight: "800",
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
  emptyButton: {
    marginTop: spacing.lg,
    minHeight: 58,
  },
  reviewButton: {
    minHeight: 54,
    borderRadius: radii.md,
    shadowOpacity: 0.18,
  },
  errorBanner: {
    borderRadius: radii.lg,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
  },
  errorText: {
    ...typography.bodyStrong,
    color: colors.danger,
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlay,
  },
  modalCard: {
    maxHeight: "88%",
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  modalScroll: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  modalTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  modalTitle: {
    ...typography.heading,
    color: colors.text,
    fontWeight: "800",
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: radii.full,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  sellerBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: colors.border,
  },
  sellerCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  sellerName: {
    ...typography.bodyStrong,
    color: colors.text,
    fontWeight: "800",
  },
  sellerLote: {
    ...typography.caption,
    color: colors.subtext,
  },
  ratingSection: {
    gap: spacing.sm,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.subtext,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  interactiveStars: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  starHitbox: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  textarea: {
    minHeight: 126,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  counter: {
    ...typography.caption,
    color: colors.subtext,
    textAlign: "right",
  },
  inlineError: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    padding: spacing.md,
  },
  inlineErrorText: {
    ...typography.bodyStrong,
    color: colors.danger,
    flex: 1,
  },
  modalPrimaryButton: {
    minHeight: 56,
    borderRadius: radii.md,
  },
  successContent: {
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  successIcon: {
    width: 70,
    height: 70,
    borderRadius: radii.full,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  successStars: {
    justifyContent: "center",
  },
  successComment: {
    ...typography.body,
    color: colors.subtext,
    textAlign: "center",
    paddingHorizontal: spacing.sm,
  },
});
