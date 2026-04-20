import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { getPedidos } from "../../services/pedidosService";
import Card from "../../components/ui/Card";
import { colors } from "../../styles/colors";
import { spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

export default function MisPedidosScreen() {
  const [pedidos, setPedidos] = useState<any[]>([]);

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const data = await getPedidos();
        setPedidos(data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchPedidos();
  }, []);

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
});
