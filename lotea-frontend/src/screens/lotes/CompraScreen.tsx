import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import Button from "../../components/ui/Button";
import { colors } from "../../styles/colors";
import { spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

const BASE_URL = "http://192.168.0.65:3000";

export default function CompraScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const { lote } = route.params;

  const [cantidad, setCantidad] = useState(1);

  const total = cantidad * Number(lote.precio);

  const handleBuy = async () => {
    try {
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
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{lote.titulo}</Text>

      <Text style={styles.label}>Cantidad</Text>

      <View style={styles.counter}>
        <TouchableOpacity
          onPress={() => setCantidad(Math.max(1, cantidad - 1))}
        >
          <Text style={styles.btn}>-</Text>
        </TouchableOpacity>

        <Text style={styles.value}>{cantidad}</Text>

        <TouchableOpacity
          onPress={() => setCantidad(Math.min(lote.cantidad, cantidad + 1))}
        >
          <Text style={styles.btn}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.total}>Total: {total.toFixed(2)} EUR</Text>

      <Button title="Confirmar compra" onPress={handleBuy} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
    justifyContent: "center",
  },
  title: {
    ...typography.title,
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.bodyStrong,
    marginBottom: spacing.sm,
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  btn: {
    fontSize: 28,
    paddingHorizontal: 12,
  },
  value: {
    fontSize: 20,
  },
  total: {
    ...typography.title,
    marginBottom: spacing.lg,
  },
});
