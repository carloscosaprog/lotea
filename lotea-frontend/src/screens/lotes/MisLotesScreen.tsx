import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { getMisLotes, deleteLote } from "../../services/lotesService";
import type { Lote } from "../../types/Lote";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { colors } from "../../styles/colors";
import { layoutStyles } from "../../styles/theme";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

export default function MisLotesScreen() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation<any>();

  const fetchLotes = async () => {
    try {
      const data = await getMisLotes();
      setLotes(data);
    } catch (error) {
      console.error("Error al cargar tus lotes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLotes();
  }, []);

  const handleDelete = async (id: number) => {
    Alert.alert("Eliminar lote", "¿Eliminar lote?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteLote(id);
            setLotes((current) => current.filter((l) => l.id_lote !== id));
          } catch (error) {
            console.error(error);
            Alert.alert("Error al eliminar lote");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={layoutStyles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando tus lotes...</Text>
      </View>
    );
  }

  return (
    <View style={layoutStyles.screen}>
      <FlatList
        data={lotes}
        keyExtractor={(item) => item.id_lote.toString()}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <View style={styles.topBar}>
              <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={22} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.topBarTitle}>Mis lotes</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate("Vender")
                }
              >
                <Text style={styles.topBarAction}>Nuevo</Text>
              </TouchableOpacity>
            </View>

            <View style={layoutStyles.pageHeader}>
              <Text style={layoutStyles.headerEyebrow}>Gestion</Text>
              <Text style={styles.title}>Tus publicaciones activas</Text>
              <Text style={layoutStyles.headerSubtitle}>
                Edita, revisa o elimina los lotes que tienes publicados.
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Card>
            <Text style={styles.emptyTitle}>Aun no has creado ningun lote</Text>
            <Text style={styles.emptyText}>
              Publica tu primer lote para empezar a vender dentro de LOTEA.
            </Text>
            <Button
              title="Crear mi primer lote"
              onPress={() => navigation.navigate("Vender")}
              style={styles.emptyButton}
            />
          </Card>
        }
        renderItem={({ item }) => (
          <Card contentStyle={styles.cardContent}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.info}
              onPress={() =>
                navigation.navigate("Home", {
                  screen: "LoteDetail",
                  params: { id: item.id_lote },
                })
              }
            >
              <Image
                source={{
                  uri: item.imagen || "https://picsum.photos/100",
                }}
                style={styles.image}
              />

              <View style={styles.copy}>
                <Text style={styles.titleItem}>{item.titulo}</Text>
                <Text style={styles.subtitle}>{item.cantidad} unidades</Text>
                <Text style={styles.price}>{item.precio} EUR</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.actionsRow}>
              <Button
                title="Editar"
                variant="secondary"
                style={styles.actionButton}
                onPress={() =>
                  navigation.navigate("Perfil", {
                    screen: "EditLote",
                    params: { id: item.id_lote },
                  })
                }
              />
              <Button
                title="Eliminar"
                variant="danger"
                style={styles.actionButton}
                onPress={() => handleDelete(item.id_lote)}
              />
            </View>
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
  topBarAction: {
    ...typography.bodyStrong,
    color: colors.primary,
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
  info: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  image: {
    width: 88,
    height: 88,
    borderRadius: radii.md,
    backgroundColor: "#E5E7EB",
  },
  copy: {
    flex: 1,
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
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
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
