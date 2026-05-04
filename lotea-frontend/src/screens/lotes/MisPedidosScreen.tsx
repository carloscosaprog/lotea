import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { getPedidos } from "../../services/pedidosService";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { colors } from "../../styles/colors";
import { spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";
import { layoutStyles } from "../../styles/theme";
import { API_URL } from "../../config/api";

export default function MisPedidosScreen() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const fetchPedidos = async () => {
    try {
      const data = await getPedidos();
      setPedidos(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
  }, []);

  const updateEstado = async (id: number, estado: string) => {
    try {
      const token = await AsyncStorage.getItem("token");

      await axios.put(
        `${API_URL}/pedidos/${id}`,
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

  if (loading) {
    return (
      <View style={layoutStyles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando tus pedidos...</Text>
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

              <Text style={styles.topBarTitle}>Mis pedidos</Text>

              <View style={{ width: 22 }} />
            </View>

            <View style={layoutStyles.pageHeader}>
              <Text style={layoutStyles.headerEyebrow}>Compras</Text>
              <Text style={styles.title}>Tus pedidos realizados</Text>
              <Text style={layoutStyles.headerSubtitle}>
                Consulta el estado de tus compras y su progreso.
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Card style={{ marginHorizontal: spacing.lg }}>
            <Text style={styles.emptyTitle}>
              Aun no has realizado ningun pedido
            </Text>
            <Text style={styles.emptyText}>
              Explora lotes y realiza tu primera compra en LOTEA.
            </Text>
            <Button
              title="Ver lotes"
              onPress={() => navigation.navigate("Home")}
              style={styles.emptyButton}
            />
          </Card>
        }
        renderItem={({ item }) => (
          <Card contentStyle={styles.cardContent}>
            <View style={styles.copy}>
              <Text style={styles.titleItem}>{item.titulo}</Text>
              <Text style={styles.subtitle}>Cantidad: {item.cantidad}</Text>
              <Text style={styles.price}>{item.precio_unitario} EUR</Text>
              <Text style={styles.estado}>Estado: {item.estado}</Text>
            </View>

            {item.id_usuario !== user?.id && item.estado === "pendiente" && (
              <View style={styles.actionsRow}>
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
    gap: spacing.md,
  },
  copy: {
    gap: 4,
  },
  titleItem: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.subtext,
  },
  price: {
    ...typography.heading,
    color: colors.accent,
  },
  estado: {
    ...typography.caption,
    color: colors.primary,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
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
  },
});
