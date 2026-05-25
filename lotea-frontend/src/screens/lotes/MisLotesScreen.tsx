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
import PrimaryActionButton from "../../components/ui/PrimaryActionButton";
import Card from "../../components/ui/Card";
import { colors } from "../../styles/colors";
import { layoutStyles } from "../../styles/theme";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";
import { getImageUrl } from "../../utils/getImageUrl";

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
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="chevron-back" size={22} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.topBarTitle}>Mis lotes</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate("Vender")}
              >
                <Text style={styles.topBarAction}>Nuevo</Text>
              </TouchableOpacity>
            </View>

            <View style={layoutStyles.pageHeader}>
              <Text style={layoutStyles.headerEyebrow}>Gestion</Text>
              <Text style={styles.title}>Tus publicaciones</Text>
              <Text style={layoutStyles.headerSubtitle}>
                Edita tus lotes activos y revisa las ventas cerradas.
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
            <PrimaryActionButton
              title="Crear mi primer lote"
              onPress={() => navigation.navigate("Vender")}
              style={{ marginTop: spacing.lg }}
            />
          </Card>
        }
        renderItem={({ item }) => (
          <Card contentStyle={styles.cardContent} style={styles.marketCard}>
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
                  uri: getImageUrl(item.imagenes?.[0]),
                }}
                style={[styles.image, item.vendido && styles.imageSold]}
              />

              <View style={styles.copy}>
                <View style={styles.titleRow}>
                  <Text style={styles.titleItem}>{item.titulo}</Text>
                  {item.vendido && (
                    <View style={styles.soldPill}>
                      <Text style={styles.soldPillText}>Vendido</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.subtitle}>
                  {item.vendido
                    ? `${item.total_vendido ?? 0} unidades vendidas`
                    : `${item.cantidad} unidades disponibles`}
                </Text>
                <Text style={styles.price}>{item.precio} EUR</Text>
              </View>
            </TouchableOpacity>

            {item.vendido && item.compradores?.length ? (
              <View style={styles.buyersBox}>
                <View style={styles.buyersHeader}>
                  <Ionicons
                    name="people-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.buyersTitle}>Compradores</Text>
                </View>

                {item.compradores.map((comprador) => (
                  <View key={comprador.id_usuario} style={styles.buyerRow}>
                    <Text style={styles.buyerName}>{comprador.nombre}</Text>
                    <Text style={styles.buyerMeta}>
                      {comprador.cantidad} uds - {comprador.total.toFixed(2)} EUR
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.actionsRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.actionButton, styles.editButton]}
                onPress={() =>
                  navigation.navigate("Perfil", {
                    screen: "EditLote",
                    params: { id: item.id_lote },
                  })
                }
              >
                <View style={styles.actionButtonContent}>
                  <Ionicons
                    name="pencil-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={styles.editButtonText}>Editar</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(item.id_lote)}
              >
                <View style={styles.actionButtonContent}>
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={colors.white}
                  />
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </View>
              </TouchableOpacity>
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
    gap: spacing.lg,
    paddingVertical: spacing.sm,
  },
  info: {
    flexDirection: "row",
    gap: spacing.lg,
    alignItems: "center",
  },
  image: {
    width: 110,
    height: 110,
    borderRadius: radii.lg,
    backgroundColor: "#E5E7EB",
  },
  imageSold: {
    opacity: 0.72,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    gap: spacing.xs,
  },
  titleItem: {
    ...typography.bodyStrong,
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
  },
  subtitle: {
    ...typography.caption,
    color: colors.subtext,
  },
  price: {
    ...typography.heading,
    color: colors.accent,
    fontWeight: "900",
    fontSize: 20,
  },
  soldPill: {
    alignSelf: "flex-start",
    borderRadius: radii.full,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  soldPillText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: "900",
  },
  buyersBox: {
    borderRadius: radii.lg,
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    padding: spacing.md,
    gap: spacing.sm,
  },
  buyersHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  buyersTitle: {
    ...typography.bodyStrong,
    color: colors.text,
    fontWeight: "900",
  },
  buyerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  buyerName: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
    fontWeight: "800",
  },
  buyerMeta: {
    ...typography.caption,
    color: colors.subtext,
    textAlign: "right",
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,

    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#EFF6FF",
  },
  actionButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: radii.md,

    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  actionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },

  editButton: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },

  deleteButton: {
    backgroundColor: colors.danger,
  },

  editButtonText: {
    ...typography.bodyStrong,
    color: colors.primary,
    fontWeight: "800",
    fontSize: 15,
  },

  deleteButtonText: {
    ...typography.bodyStrong,
    color: colors.white,
    fontWeight: "800",
    fontSize: 15,
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
  marketCard: {
    borderWidth: 1,
    borderColor: "#E0ECFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
});
