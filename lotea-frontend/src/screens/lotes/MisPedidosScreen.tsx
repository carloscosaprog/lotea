import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { getPedidos } from "../../services/pedidosService";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { colors } from "../../styles/colors";
import { spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

const BASE_URL = "http://192.168.0.65:3000";

export default function MisPedidosScreen() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const { user } = useAuth();

  const fetchPedidos = async () => {
    try {
      const data = await getPedidos();
      setPedidos(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchPedidos();
  }, []);

  const updateEstado = async (id: number, estado: string) => {
    try {
      const token = await AsyncStorage.getItem("token");

      await axios.put(
        `${BASE_URL}/pedidos/${id}`,
        { estado },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      fetchPedidos();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis pedidos</Text>

      <FlatList
        data={pedidos}
        keyExtractor={(item) => item.id_pedido.toString()}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={styles.lote}>{item.titulo}</Text>
            <Text style={styles.info}>Cantidad: {item.cantidad}</Text>
            <Text style={styles.info}>Precio: {item.precio_unitario} EUR</Text>
            <Text style={styles.estado}>Estado: {item.estado}</Text>

            {item.id_usuario !== user?.id && item.estado === "pendiente" && (
              <View style={styles.actions}>
                <Button
                  title="Completar"
                  onPress={() => updateEstado(item.id_pedido, "completado")}
                />
                <Button
                  title="Cancelar"
                  variant="danger"
                  onPress={() => updateEstado(item.id_pedido, "cancelado")}
                />
              </View>
            )}
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.heading,
    marginBottom: spacing.lg,
  },
  card: {
    marginBottom: spacing.md,
  },
  lote: {
    ...typography.bodyStrong,
  },
  info: {
    ...typography.body,
  },
  estado: {
    ...typography.caption,
    color: colors.primary,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
