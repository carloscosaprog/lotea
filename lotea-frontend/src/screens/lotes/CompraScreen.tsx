import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

import Card from "../../components/ui/Card";
import PrimaryActionButton from "../../components/ui/PrimaryActionButton";
import SecondaryActionButton from "../../components/ui/SecondaryActionButton";
import { createPedido } from "../../services/pedidosService";
import { colors } from "../../styles/colors";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";
import type { Lote } from "../../types/Lote";
import type { MetodoPago, Pedido } from "../../types/Pedido";
import { getImageUrl } from "../../utils/getImageUrl";

const PLATFORM_FEE_RATE = 0.1;

const paymentMethods: {
  id: MetodoPago;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    id: "tarjeta",
    title: "Tarjeta bancaria",
    description: "Pago simulado con tarjeta para la demo.",
    icon: "card-outline",
  },
  {
    id: "paypal",
    title: "PayPal",
    description: "Seleccion visual, sin redireccion real.",
    icon: "logo-paypal",
  },
  {
    id: "bizum",
    title: "Bizum",
    description: "Confirmacion simulada instantanea.",
    icon: "phone-portrait-outline",
  },
  {
    id: "transferencia",
    title: "Transferencia bancaria",
    description: "Pedido marcado como pagado para demostracion.",
    icon: "business-outline",
  },
];

const stepTitles = ["Lote", "Pago", "Confirmacion", "Exito"];

const formatCurrency = (value: number) => `${value.toFixed(2)} EUR`;

const getErrorMessage = (error: any) =>
  error?.response?.data?.message ??
  "No se pudo completar la compra. Revisa tu conexion e intentalo de nuevo.";

export default function CompraScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const lote = route.params?.lote as Lote;

  const [step, setStep] = useState(1);
  const [cantidad, setCantidad] = useState(1);
  const [inputValue, setInputValue] = useState("1");
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("tarjeta");
  const [direccionEntrega, setDireccionEntrega] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pedidoCreado, setPedidoCreado] = useState<Pedido | null>(null);

  const successScale = useRef(new Animated.Value(0.78)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  const stock = Number(lote?.cantidad ?? 0);
  const unitPrice = Number(lote?.precio ?? 0);
  const subtotal = cantidad * unitPrice;
  const platformFee = subtotal * PLATFORM_FEE_RATE;
  const total = subtotal + platformFee;
  const selectedMethod = paymentMethods.find((item) => item.id === metodoPago);
  const stockExceeded = cantidad > stock;
  const isSoldOut = stock <= 0;
  const imagenPrincipal = getImageUrl(lote?.imagenes?.[0]);

  useEffect(() => {
    if (step === 4) {
      Animated.parallel([
        Animated.spring(successScale, {
          toValue: 1,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 360,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [step, successOpacity, successScale]);

  const canContinue = useMemo(() => {
    if (step === 1) return !isSoldOut && !stockExceeded && cantidad >= 1;
    if (step === 2) return Boolean(metodoPago);
    if (step === 3) return !loading;

    return true;
  }, [cantidad, isSoldOut, loading, metodoPago, step, stockExceeded]);

  const setQuantity = (next: number) => {
    const normalized = Number.isFinite(next) ? Math.max(1, next) : 1;

    setCantidad(normalized);
    setInputValue(String(normalized));
    setErrorMessage(
      normalized > stock
        ? `Solo quedan ${stock} unidades disponibles de este lote.`
        : null,
    );
  };

  const handleCantidadChange = (value: string) => {
    const limpio = value.replace(/[^0-9]/g, "");
    setInputValue(limpio);

    if (!limpio) {
      setCantidad(1);
      setErrorMessage(null);
      return;
    }

    const numero = parseInt(limpio, 10);
    setCantidad(numero);
    setErrorMessage(
      numero > stock
        ? `Solo quedan ${stock} unidades disponibles de este lote.`
        : null,
    );
  };

  const handleBlur = () => {
    if (!inputValue) {
      setQuantity(1);
      return;
    }

    setInputValue(String(cantidad));
  };

  const goNext = async () => {
    if (!canContinue) return;

    if (step < 3) {
      setStep((current) => current + 1);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const pedido = await createPedido({
        id_lote: lote.id_lote,
        cantidad,
        metodo_pago: metodoPago,
        direccion_entrega: direccionEntrega.trim() || undefined,
      });

      setPedidoCreado(pedido);
      setStep(4);
    } catch (error: any) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const goBackStep = () => {
    if (step === 1) {
      navigation.goBack();
      return;
    }

    setStep((current) => Math.max(1, current - 1));
  };

  const renderStepper = () => (
    <View style={styles.stepper}>
      {stepTitles.map((title, index) => {
        const stepNumber = index + 1;
        const active = stepNumber === step;
        const completed = stepNumber < step;

        return (
          <View key={title} style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                active && styles.stepDotActive,
                completed && styles.stepDotCompleted,
              ]}
            >
              <Text
                style={[
                  styles.stepDotText,
                  active && styles.stepDotTextCurrent,
                  completed && styles.stepDotTextActive,
                ]}
              >
                {completed ? "OK" : stepNumber}
              </Text>
            </View>
            <Text
              style={[
                styles.stepLabel,
                active && styles.stepLabelActive,
                completed && styles.stepLabelActive,
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
          </View>
        );
      })}
    </View>
  );

  const renderError = () =>
    errorMessage ? (
      <View style={styles.inlineMessage}>
        <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
        <Text style={styles.inlineMessageText}>{errorMessage}</Text>
      </View>
    ) : null;

  const renderLotSummary = () => (
    <Card contentStyle={styles.loteCard}>
      <Image source={{ uri: imagenPrincipal }} style={styles.image} />

      <View style={styles.loteCopy}>
        <Text style={styles.title}>{lote.titulo}</Text>
        <Text style={styles.subtitle}>
          {formatCurrency(unitPrice)} / unidad
        </Text>
        <View style={[styles.stockPill, isSoldOut && styles.stockPillDanger]}>
          <Text style={[styles.stockText, isSoldOut && styles.stockTextDanger]}>
            {isSoldOut ? "Lote agotado" : `Stock disponible: ${stock}`}
          </Text>
        </View>
      </View>
    </Card>
  );

  const renderQuantityStep = () => (
    <>
      {renderLotSummary()}

      <Card>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Ionicons name="cube-outline" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Cantidad</Text>
            <Text style={styles.sectionText}>
              Ajusta las unidades que quieres comprar.
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.quantityControl,
            stockExceeded && styles.quantityControlError,
          ]}
        >
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity(cantidad - 1)}
            disabled={cantidad <= 1 || isSoldOut}
            activeOpacity={0.85}
          >
            <Ionicons name="remove" size={22} color={colors.primary} />
          </TouchableOpacity>

          <TextInput
            style={styles.quantityInput}
            value={inputValue}
            onChangeText={handleCantidadChange}
            onBlur={handleBlur}
            keyboardType="number-pad"
            selectTextOnFocus
          />

          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity(cantidad + 1)}
            disabled={isSoldOut}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.stockHelperRow}>
          <Ionicons
            name={
              stockExceeded || isSoldOut
                ? "warning-outline"
                : "shield-checkmark-outline"
            }
            size={16}
            color={stockExceeded || isSoldOut ? colors.danger : colors.accent}
          />
          <Text
            style={[
              styles.helper,
              (stockExceeded || isSoldOut) && styles.helperError,
            ]}
          >
            {isSoldOut
              ? "Este lote no tiene unidades disponibles."
              : stockExceeded
                ? `Has superado el stock disponible (${stock}).`
                : `Puedes comprar hasta ${stock} unidades.`}
          </Text>
        </View>
      </Card>
    </>
  );

  const renderPaymentStep = () => (
    <>
      {renderLotSummary()}

      <Card>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Ionicons name="wallet-outline" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Metodo de pago simulado</Text>
            <Text style={styles.sectionText}>
              No se procesara ningun pago real.
            </Text>
          </View>
        </View>

        <View style={styles.paymentList}>
          {paymentMethods.map((method) => {
            const selected = method.id === metodoPago;

            return (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentOption,
                  selected && styles.paymentOptionSelected,
                ]}
                onPress={() => setMetodoPago(method.id)}
                activeOpacity={0.88}
              >
                <View
                  style={[
                    styles.paymentIcon,
                    selected && styles.paymentIconSelected,
                  ]}
                >
                  <Ionicons
                    name={method.icon}
                    size={22}
                    color={selected ? colors.white : colors.primary}
                  />
                </View>
                <View style={styles.paymentCopy}>
                  <Text style={styles.paymentTitle}>{method.title}</Text>
                  <Text style={styles.paymentDescription}>
                    {method.description}
                  </Text>
                </View>
                <Ionicons
                  name={selected ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={selected ? colors.accent : colors.border}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>
    </>
  );

  const renderConfirmationStep = () => (
    <>
      {renderLotSummary()}

      <Card>
        <View style={styles.demoBanner}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.demoBannerText}>
            Esta es una simulacion de compra para fines demostrativos.
          </Text>
        </View>

        <View style={styles.addressBlock}>
          <Text style={styles.inputLabel}>Direccion de entrega</Text>
          <TextInput
            style={styles.addressInput}
            value={direccionEntrega}
            onChangeText={setDireccionEntrega}
            placeholder="Ej. Calle Mayor 12, Madrid"
            placeholderTextColor={colors.subtext}
          />
        </View>

        {renderOrderSummary()}
      </Card>
    </>
  );

  const renderOrderSummary = () => (
    <View style={styles.summary}>
      <Text style={styles.sectionTitle}>Resumen del pedido</Text>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Producto</Text>
        <Text style={styles.summaryValue} numberOfLines={1}>
          {lote.titulo}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Cantidad</Text>
        <Text style={styles.summaryValue}>{cantidad}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Subtotal</Text>
        <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Comision plataforma</Text>
        <Text style={styles.summaryValue}>{formatCurrency(platformFee)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Metodo de pago</Text>
        <Text style={styles.summaryValue}>
          {selectedMethod?.title ?? "Simulado"}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.summaryRow}>
        <Text style={styles.summaryTotal}>Total</Text>
        <Text style={styles.summaryTotal}>{formatCurrency(total)}</Text>
      </View>
    </View>
  );

  const renderSuccessStep = () => {
    const orderNumber = pedidoCreado
      ? `LOTEA-${String(pedidoCreado.id_pedido).padStart(6, "0")}`
      : "LOTEA-000000";

    return (
      <View style={styles.successWrap}>
        <Animated.View
          style={[
            styles.successIconWrap,
            {
              opacity: successOpacity,
              transform: [{ scale: successScale }],
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={74} color={colors.white} />
        </Animated.View>

        <Text style={styles.successTitle}>Pedido confirmado</Text>
        <Text style={styles.successText}>
          Tu compra simulada se ha registrado correctamente.
        </Text>

        <Card style={styles.successCard}>
          <View style={styles.successRow}>
            <Text style={styles.summaryLabel}>Numero de pedido</Text>
            <Text style={styles.successOrder}>{orderNumber}</Text>
          </View>
          <View style={styles.successRow}>
            <Text style={styles.summaryLabel}>Producto</Text>
            <Text style={styles.summaryValue}>{lote.titulo}</Text>
          </View>
          <View style={styles.successRow}>
            <Text style={styles.summaryLabel}>Cantidad</Text>
            <Text style={styles.summaryValue}>{cantidad}</Text>
          </View>
          <View style={styles.successRow}>
            <Text style={styles.summaryLabel}>Total estimado</Text>
            <Text style={styles.summaryValue}>{formatCurrency(total)}</Text>
          </View>
        </Card>

        <PrimaryActionButton
          title="Ver pedido"
          icon="receipt-outline"
          onPress={() =>
            pedidoCreado &&
            navigation.navigate("PedidoDetail", { id: pedidoCreado.id_pedido })
          }
          disabled={!pedidoCreado}
          style={styles.successButton}
        />
        <SecondaryActionButton
          title="Volver al inicio"
          onPress={() => navigation.navigate("HomeMain")}
          style={styles.successButton}
        />
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={goBackStep} activeOpacity={0.8}>
            <Ionicons
              name={step === 4 ? "close" : "chevron-back"}
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Comprar lote</Text>
          <View style={{ width: 24 }} />
        </View>

        {step < 4 && renderStepper()}
        {step < 4 && renderError()}

        {step === 1 && renderQuantityStep()}
        {step === 2 && renderPaymentStep()}
        {step === 3 && renderConfirmationStep()}
        {step === 4 && renderSuccessStep()}
      </ScrollView>

      {step < 4 && (
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerLabel}>Total</Text>
            <Text style={styles.footerTotal}>{formatCurrency(total)}</Text>
          </View>

          <PrimaryActionButton
            title={
              loading
                ? "Procesando..."
                : step === 3
                  ? "Confirmar pedido"
                  : "Continuar"
            }
            icon={step === 3 ? "checkmark-circle-outline" : "arrow-forward"}
            onPress={goNext}
            disabled={!canContinue || loading}
            style={styles.footerButton}
          />
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Creando pedido simulado...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 128,
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
  stepper: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  stepItem: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: {
    borderColor: colors.primary,
    backgroundColor: "#EFF6FF",
  },
  stepDotCompleted: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  stepDotText: {
    ...typography.caption,
    color: colors.subtext,
    fontWeight: "800",
  },
  stepDotTextActive: {
    color: colors.white,
  },
  stepDotTextCurrent: {
    color: colors.primary,
  },
  stepLabel: {
    ...typography.caption,
    color: colors.subtext,
    fontSize: 11,
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: "800",
  },
  loteCard: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  image: {
    width: 92,
    height: 92,
    borderRadius: radii.md,
    backgroundColor: "#E5E7EB",
  },
  loteCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
    fontSize: 17,
    lineHeight: 23,
  },
  subtitle: {
    ...typography.caption,
    color: colors.subtext,
  },
  stockPill: {
    alignSelf: "flex-start",
    borderRadius: radii.full,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  stockPillDanger: {
    backgroundColor: "#FEE2E2",
  },
  stockText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: "800",
  },
  stockTextDanger: {
    color: colors.danger,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    ...typography.bodyStrong,
    color: colors.text,
    fontWeight: "800",
  },
  sectionText: {
    ...typography.caption,
    color: colors.subtext,
  },
  quantityControl: {
    height: 64,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  quantityControlError: {
    borderColor: colors.danger,
    backgroundColor: "#FFF7F7",
  },
  quantityButton: {
    width: 64,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
  },
  quantityInput: {
    flex: 1,
    textAlign: "center",
    color: colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
  },
  stockHelperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  helper: {
    ...typography.caption,
    color: colors.subtext,
    flex: 1,
  },
  helperError: {
    color: colors.danger,
    fontWeight: "700",
  },
  paymentList: {
    gap: spacing.sm,
  },
  paymentOption: {
    minHeight: 82,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
  },
  paymentOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: "#EFF6FF",
  },
  paymentIcon: {
    width: 46,
    height: 46,
    borderRadius: radii.full,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentIconSelected: {
    backgroundColor: colors.primary,
  },
  paymentCopy: {
    flex: 1,
    gap: 2,
  },
  paymentTitle: {
    ...typography.bodyStrong,
    color: colors.text,
    fontWeight: "800",
  },
  paymentDescription: {
    ...typography.caption,
    color: colors.subtext,
  },
  demoBanner: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    backgroundColor: "#EFF6FF",
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  demoBannerText: {
    ...typography.bodyStrong,
    color: colors.primary,
    flex: 1,
  },
  addressBlock: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.subtext,
  },
  addressInput: {
    minHeight: 54,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 15,
  },
  summary: {
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
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
  inlineMessage: {
    borderRadius: radii.lg,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
  },
  inlineMessageText: {
    ...typography.bodyStrong,
    color: colors.danger,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  footerLabel: {
    ...typography.caption,
    color: colors.subtext,
  },
  footerTotal: {
    ...typography.heading,
    color: colors.text,
  },
  footerButton: {
    minWidth: 190,
    minHeight: 58,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17,24,39,0.28)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  loadingBox: {
    minWidth: 220,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: {
    ...typography.bodyStrong,
    color: colors.text,
    textAlign: "center",
  },
  successWrap: {
    alignItems: "center",
    gap: spacing.lg,
    paddingTop: spacing.xl,
  },
  successIconWrap: {
    width: 116,
    height: 116,
    borderRadius: radii.full,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 8,
  },
  successTitle: {
    ...typography.title,
    color: colors.text,
    textAlign: "center",
  },
  successText: {
    ...typography.body,
    color: colors.subtext,
    textAlign: "center",
  },
  successCard: {
    alignSelf: "stretch",
  },
  successRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  successOrder: {
    ...typography.bodyStrong,
    color: colors.primary,
    fontWeight: "900",
  },
  successButton: {
    alignSelf: "stretch",
    minHeight: 60,
  },
});
