import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  ScrollView,
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
import { API_URL } from "../../config/api";
import { getImageUrl } from "../../utils/getImageUrl";

export default function CompraScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const { lote } = route.params;

  const [cantidad, setCantidad] = useState(1);
  const [inputValue, setInputValue] = useState("1");
  const [loading, setLoading] = useState(false);

  const total = cantidad * Number(lote.precio);

  const comisionPorcentaje = 0.1;
  const comision = total * comisionPorcentaje;
  const totalVendedor = total - comision;

  const imagenPrincipal =
    lote.imagenes && lote.imagenes.length > 0 && lote.imagenes[0]?.url
      ? getImageUrl(lote.imagenes[0].url)
      : "https://picsum.photos/200";

  const handleCantidadChange = (value: string) => {
    const limpio = value.replace(/[^0-9]/g, "");
    setInputValue(limpio);

    const numero = parseInt(limpio, 10);

    if (!limpio) return;

    if (numero < 1) {
      setCantidad(1);
    } else if (numero > lote.cantidad) {
      setCantidad(lote.cantidad);
    } else {
      setCantidad(numero);
    }
  };

  const handleBlur = () => {
    if (!inputValue) {
      setCantidad(1);
      setInputValue("1");
      return;
    }

    const numero = parseInt(inputValue, 10);

    if (numero < 1) {
      setCantidad(1);
      setInputValue("1");
    } else if (numero > lote.cantidad) {
      setCantidad(lote.cantidad);
      setInputValue(String(lote.cantidad));
    } else {
      setInputValue(String(numero));
    }
  };

  const handleBuy = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      await axios.post(
        `${API_URL}/pedidos`,
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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        contentInset={{ bottom: 120 }}
      >
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

          <TextInput
            style={styles.inputFull}
            value={inputValue}
            onChangeText={handleCantidadChange}
            onBlur={handleBlur}
            keyboardType="number-pad"
            selectTextOnFocus
            placeholder="Introduce cantidad"
          />

          <Text style={styles.helper}>Máximo disponible: {lote.cantidad}</Text>
        </Card>

        {/* RESUMEN */}
        <Card>
          <Text style={styles.label}>Resumen de compra</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Precio unidad</Text>
            <Text>{lote.precio} EUR</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Cantidad</Text>
            <Text>{cantidad}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Comisión plataforma</Text>
            <Text>{comision.toFixed(2)} EUR</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Para el vendedor</Text>
            <Text>{totalVendedor.toFixed(2)} EUR</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotal}>Total</Text>
            <Text style={styles.summaryTotal}>{total.toFixed(2)} EUR</Text>
          </View>
        </Card>
      </ScrollView>

      {/* FOOTER */}
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
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 140,
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
  inputFull: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.white,
  },
  helper: {
    ...typography.caption,
    color: colors.subtext,
    marginTop: spacing.xs,
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
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
