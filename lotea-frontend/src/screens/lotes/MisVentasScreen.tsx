import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import Card from "../../components/ui/Card";
import PrimaryActionButton from "../../components/ui/PrimaryActionButton";
import { getVentas } from "../../services/pedidosService";
import { colors } from "../../styles/colors";
import { layoutStyles } from "../../styles/theme";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";
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

const getVentaResumen = (pedido: Pedido) => {
  const detalle = pedido.detalles[0];
  const lote = detalle?.lote;
  const subtotal = pedido.detalles.reduce(
    (sum, item) => sum + Number(item.precio_unitario) * item.cantidad,
    0,
  );

  return {
    detalle,
    lote,
    subtotal,
    image: getImageUrl(lote?.imagenes?.[0]),
    comprador: pedido.usuario?.nombre ?? "Comprador",
  };
};

export default function MisVentasScreen() {
  const [ventas, setVentas] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigation = useNavigation<any>();

  const fetchVentas = useCallback(async () => {
    try {
      setErrorMessage(null);
      const data = await getVentas();
      setVentas(data);
    } catch (error) {
      console.log(error);
      setErrorMessage("No se pudieron cargar tus ventas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchVentas();
    }, [fetchVentas]),
  );

  if (loading) {
    return (
      <View style={layoutStyles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando tus ventas...</Text>
      </View>
    );
  }

  return (
    <View style={layoutStyles.screen}>
      <FlatList
        data={ventas}
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

              <Text style={styles.topBarTitle}>Mis ventas</Text>

              <View style={{ width: 22 }} />
            </View>

            <View style={layoutStyles.pageHeader}>
              <Text style={layoutStyles.headerEyebrow}>Ventas</Text>
              <Text style={styles.title}>Pedidos recibidos</Text>
              <Text style={layoutStyles.headerSubtitle}>
                Gestiona los pedidos que han comprado tus lotes.
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
            <Text style={styles.emptyTitle}>Todavia no has recibido ventas</Text>
            <Text style={styles.emptyText}>
              Cuando alguien compre uno de tus lotes, aparecera aqui.
            </Text>
            <PrimaryActionButton
              title="Ver mis lotes"
              icon="cube-outline"
              onPress={() => navigation.navigate("MisLotes")}
              style={styles.emptyButton}
            />
          </Card>
        }
        renderItem={({ item }) => {
          const { detalle, lote, subtotal, image, comprador } =
            getVentaResumen(item);
          const estadoColor = estadoColors[item.estado] ?? colors.primary;

          return (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate("PedidoDetail", {
                  id: item.id_pedido,
                  perspective: "seller",
                })
              }
            >
              <Card contentStyle={styles.cardContent}>
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
                    Comprador: {comprador} - {detalle?.cantidad ?? 0} unidades
                  </Text>

                  <View style={styles.metaRow}>
                    <View>
                      <Text style={styles.price}>
                        {formatCurrency(subtotal)}
                      </Text>
                      <Text style={styles.netHint}>
                        Importe producto sin comision
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.estadoPill,
                        { backgroundColor: `${estadoColor}18` },
                      ]}
                    >
                      <Text style={[styles.estadoText, { color: estadoColor }]}>
                        {estadoLabels[item.estado] ?? item.estado}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
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
  cardContent: {
    marginHorizontal: spacing.lg,
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
  netHint: {
    ...typography.caption,
    color: colors.subtext,
    fontSize: 11,
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
});
