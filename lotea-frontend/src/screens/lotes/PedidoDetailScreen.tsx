import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";

import Card from "../../components/ui/Card";
import PrimaryActionButton from "../../components/ui/PrimaryActionButton";
import {
  getPedidoById,
  simularSiguienteEstado,
} from "../../services/pedidosService";
import { colors } from "../../styles/colors";
import { layoutStyles } from "../../styles/theme";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";
import type { EstadoPedido, Pedido } from "../../types/Pedido";
import { getImageUrl } from "../../utils/getImageUrl";

const timelineSteps: {
  estado: EstadoPedido;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { estado: "pagado", label: "Pedido realizado", icon: "receipt-outline" },
  { estado: "pagado", label: "Pago confirmado", icon: "card-outline" },
  { estado: "preparando", label: "Preparando pedido", icon: "cube-outline" },
  { estado: "enviado", label: "Enviado", icon: "navigate-outline" },
  { estado: "entregado", label: "Entregado", icon: "checkmark-circle-outline" },
];

const estadoLabels: Record<string, string> = {
  pendiente_pago: "Pendiente de pago",
  pagado: "Pago confirmado",
  preparando: "Preparando",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const metodoLabels: Record<string, string> = {
  tarjeta: "Tarjeta bancaria",
  paypal: "PayPal",
  bizum: "Bizum",
  transferencia: "Transferencia bancaria",
};

const estadoOrder: Record<string, number> = {
  pendiente_pago: 0,
  pagado: 1,
  preparando: 2,
  enviado: 3,
  entregado: 4,
  cancelado: -1,
};

const formatCurrency = (value: number) => `${value.toFixed(2)} EUR`;

export default function PedidoDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const id = Number(route.params?.id);
  const isSellerPerspective = route.params?.perspective === "seller";

  const loadPedido = useCallback(async () => {
    try {
      setErrorMessage(null);
      const data = await getPedidoById(id);
      setPedido(data);
    } catch (error) {
      console.log(error);
      setErrorMessage("No se pudo cargar el detalle del pedido.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadPedido();
    }, [loadPedido]),
  );

  const resumen = useMemo(() => {
    const detalle = pedido?.detalles?.[0];
    const lote = detalle?.lote;
    const subtotal =
      pedido?.detalles.reduce(
        (sum, item) => sum + Number(item.precio_unitario) * item.cantidad,
        0,
      ) ?? 0;
    const fee = subtotal * 0.1;

    return {
      detalle,
      lote,
      subtotal,
      fee,
      total: subtotal + fee,
      image: getImageUrl(lote?.imagenes?.[0]),
      vendedor: lote?.vendedor?.nombre ?? "Vendedor",
      comprador: pedido?.usuario?.nombre ?? "Comprador",
    };
  }, [pedido]);

  const handleAdvance = async () => {
    if (!pedido || pedido.estado === "entregado") return;

    try {
      setAdvancing(true);
      setErrorMessage(null);
      const actualizado = await simularSiguienteEstado(pedido.id_pedido);
      setPedido(actualizado);
    } catch (error) {
      console.log(error);
      setErrorMessage("No se pudo avanzar el estado del pedido.");
    } finally {
      setAdvancing(false);
    }
  };

  if (loading) {
    return (
      <View style={layoutStyles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando pedido...</Text>
      </View>
    );
  }

  if (!pedido) {
    return (
      <View style={layoutStyles.center}>
        <Text style={styles.feedbackTitle}>Pedido no disponible</Text>
        <Text style={styles.feedbackText}>
          Intentalo de nuevo en unos segundos.
        </Text>
      </View>
    );
  }

  const currentOrder = estadoOrder[pedido.estado] ?? 0;
  const isCancelled = pedido.estado === "cancelado";
  const canAdvance = !isCancelled && pedido.estado !== "entregado";

  return (
    <ScrollView
      style={layoutStyles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>
          {isSellerPerspective ? "Detalle de venta" : "Detalle de pedido"}
        </Text>
        <View style={{ width: 22 }} />
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

      <Card>
        <View style={styles.orderHeader}>
          <View style={styles.orderBadge}>
            <Ionicons name="receipt-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.orderCopy}>
            <Text style={styles.orderNumber}>
              Lotea-{String(pedido.id_pedido).padStart(6, "0")}
            </Text>
            <Text style={styles.orderDate}>
              {new Date(pedido.fecha).toLocaleString()}
            </Text>
          </View>
          <View
            style={[
              styles.estadoPill,
              isCancelled ? styles.estadoDanger : styles.estadoActive,
            ]}
          >
            <Text
              style={[
                styles.estadoText,
                isCancelled ? styles.estadoTextDanger : styles.estadoTextActive,
              ]}
            >
              {estadoLabels[pedido.estado] ?? pedido.estado}
            </Text>
          </View>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Progreso del pedido</Text>
        <View style={styles.timeline}>
          {timelineSteps.map((item, index) => {
            const stepOrder = index === 0 ? 1 : estadoOrder[item.estado];
            const active = !isCancelled && currentOrder >= stepOrder;

            return (
              <View key={`${item.label}-${index}`} style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  <View
                    style={[
                      styles.timelineDot,
                      active && styles.timelineDotActive,
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={16}
                      color={active ? colors.white : colors.subtext}
                    />
                  </View>
                  {index < timelineSteps.length - 1 && (
                    <View
                      style={[
                        styles.timelineLine,
                        active && styles.timelineLineActive,
                      ]}
                    />
                  )}
                </View>
                <View style={styles.timelineCopy}>
                  <Text
                    style={[
                      styles.timelineTitle,
                      active && styles.timelineTitleActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text style={styles.timelineText}>
                    {active ? "Completado" : "Pendiente"}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Producto</Text>
        <View style={styles.productRow}>
          <Image source={{ uri: resumen.image }} style={styles.image} />
          <View style={styles.productCopy}>
            <Text style={styles.productTitle}>{resumen.lote?.titulo}</Text>
            <Text style={styles.productMeta}>
              {isSellerPerspective
                ? `Comprador: ${resumen.comprador}`
                : `Vendedor: ${resumen.vendedor}`}
            </Text>
            <Text style={styles.productMeta}>
              Cantidad: {resumen.detalle?.cantidad ?? 0}
            </Text>
          </View>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Resumen economico</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Precio unidad</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(Number(resumen.detalle?.precio_unitario ?? 0))}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(resumen.subtotal)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Comision plataforma</Text>
          <Text style={styles.summaryValue}>{formatCurrency(resumen.fee)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Metodo de pago</Text>
          <Text style={styles.summaryValue}>
            {pedido.metodo_pago
              ? (metodoLabels[pedido.metodo_pago] ?? pedido.metodo_pago)
              : "Simulado"}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTotal}>Total</Text>
          <Text style={styles.summaryTotal}>
            {formatCurrency(resumen.total)}
          </Text>
        </View>
      </Card>

      <View style={styles.actions}>
        <PrimaryActionButton
          title={advancing ? "Actualizando..." : "Simular siguiente estado"}
          icon="play-forward-outline"
          onPress={handleAdvance}
          disabled={!canAdvance || advancing}
          style={styles.actionButton}
        />
      </View>
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
  topBarTitle: {
    ...typography.heading,
    color: colors.text,
  },
  loadingText: {
    ...typography.body,
    color: colors.subtext,
    marginTop: spacing.sm,
  },
  feedbackTitle: {
    ...typography.heading,
    color: colors.text,
  },
  feedbackText: {
    ...typography.body,
    color: colors.subtext,
    textAlign: "center",
    marginTop: spacing.xs,
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
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  orderBadge: {
    width: 46,
    height: 46,
    borderRadius: radii.full,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  orderCopy: {
    flex: 1,
    gap: 2,
  },
  orderNumber: {
    ...typography.bodyStrong,
    color: colors.text,
    fontWeight: "900",
  },
  orderDate: {
    ...typography.caption,
    color: colors.subtext,
  },
  estadoPill: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  estadoActive: {
    backgroundColor: "#EFF6FF",
  },
  estadoDanger: {
    backgroundColor: "#FEE2E2",
  },
  estadoText: {
    ...typography.caption,
    fontWeight: "800",
  },
  estadoTextActive: {
    color: colors.primary,
  },
  estadoTextDanger: {
    color: colors.danger,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    color: colors.text,
    fontWeight: "900",
    marginBottom: spacing.md,
  },
  timeline: {
    gap: spacing.sm,
  },
  timelineRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  timelineRail: {
    alignItems: "center",
  },
  timelineDot: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 28,
    backgroundColor: colors.border,
  },
  timelineLineActive: {
    backgroundColor: colors.primarySoft,
  },
  timelineCopy: {
    flex: 1,
    paddingBottom: spacing.sm,
  },
  timelineTitle: {
    ...typography.bodyStrong,
    color: colors.subtext,
  },
  timelineTitleActive: {
    color: colors.text,
    fontWeight: "900",
  },
  timelineText: {
    ...typography.caption,
    color: colors.subtext,
  },
  productRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  image: {
    width: 82,
    height: 82,
    borderRadius: radii.md,
    backgroundColor: "#E5E7EB",
  },
  productCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  productTitle: {
    ...typography.bodyStrong,
    color: colors.text,
    fontWeight: "800",
  },
  productMeta: {
    ...typography.caption,
    color: colors.subtext,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.subtext,
  },
  summaryValue: {
    ...typography.bodyStrong,
    color: colors.text,
    flexShrink: 1,
    textAlign: "right",
  },
  summaryTotal: {
    ...typography.heading,
    color: colors.text,
    fontWeight: "900",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  actions: {
    gap: spacing.md,
  },
  actionButton: {
    minHeight: 60,
  },
});
