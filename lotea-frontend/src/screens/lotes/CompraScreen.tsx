import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { colors } from "../../styles/colors";
import { spacing, radii } from "../../styles/spacing";
import { typography } from "../../styles/typography";

const BASE_URL = "http://192.168.0.65:3000";

export default function CompraScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const { lote } = route.params;

  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(false);

  const total = cantidad * Number(lote.precio);

  const fixUrl = (url: string) =>
    url.replace("http://localhost:3000", BASE_URL);

  const imagenPrincipal =
    lote.imagenes && lote.imagenes.length > 0
      ? fixUrl(lote.imagenes[0].url)
      : "https://picsum.photos/200";

  const handleBuy = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      await axios.post(
        `${BASE_URL}/pedidos`,
        {
          id_lote: lote.id_lote,
          cantidad,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      Alert.alert("Compra realizada", "Pedido creado correctamente");
      navigation.goBack();
    } catch (error: any) {
      if (error.response?.data?.message) {
        Alert.alert("Error", error.response.data.message);
      } else {
        Alert.alert("Error", "No se pudo completar la compra");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Comprar lote</Text>

          <View style={{ width: 22 }} />
        </View>

        {/* CARD LOTE */}
        <Card contentStyle={styles.loteCard}>
          <Image source={{ uri: imagenPrincipal }} style={styles.image} />

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{lote.titulo}</Text>
            <Text style={styles.subtitle}>{lote.precio} EUR / unidad</Text>
            <Text style={styles.stock}>Stock disponible: {lote.cantidad}</Text>
          </View>
        </Card>

        {/* CANTIDAD */}
        <Card>
          <Text style={styles.label}>Cantidad</Text>

          <View style={styles.counter}>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => setCantidad(Math.max(1, cantidad - 1))}
            >
              <Text style={styles.counterText}>-</Text>
            </TouchableOpacity>

            <Text style={styles.value}>{cantidad}</Text>

            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => setCantidad(Math.min(lote.cantidad, cantidad + 1))}
            >
              <Text style={styles.counterText}>+</Text>
            </TouchableOpacity>
          </View>

          {cantidad === lote.cantidad && (
            <Text style={styles.warning}>
              Has alcanzado el máximo disponible
            </Text>
          )}
        </Card>

        {/* RESUMEN */}
        <Card>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Precio unidad</Text>
            <Text>{lote.precio} EUR</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Cantidad</Text>
            <Text>{cantidad}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotal}>Total</Text>
            <Text style={styles.summaryTotal}>{total.toFixed(2)} EUR</Text>
          </View>
        </Card>
      </View>

      {/* FOOTER FIJO */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerTotal}>{total.toFixed(2)} EUR</Text>
        </View>

        <Button
          title={loading ? "Procesando..." : "Confirmar compra"}
          onPress={handleBuy}
          disabled={loading}
          style={styles.buyButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
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
  loteCard: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: radii.md,
    backgroundColor: "#E5E7EB",
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.subtext,
  },
  stock: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 4,
  },
  label: {
    ...typography.bodyStrong,
    marginBottom: spacing.sm,
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  counterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: "#E5E7EB",
  },
  counterText: {
    fontSize: 20,
  },
  value: {
    fontSize: 20,
    minWidth: 40,
    textAlign: "center",
  },
  warning: {
    ...typography.caption,
    color: "orange",
    marginTop: spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    color: colors.subtext,
  },
  summaryTotal: {
    ...typography.bodyStrong,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  buyButton: {
    minWidth: 180,
  },
});
