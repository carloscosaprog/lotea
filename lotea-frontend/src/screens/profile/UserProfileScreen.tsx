import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";

import { getLotesByUser } from "../../services/lotesService";
import { getUserById } from "../../services/authService";
import LoteCard from "../../components/lotes/LoteCard";
import Avatar from "../../components/ui/Avatar";
import Card from "../../components/ui/Card";
import type { Lote } from "../../types/Lote";
import { colors } from "../../styles/colors";
import { layoutStyles } from "../../styles/theme";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

export default function UserProfileScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id } = route.params;

  const [lotes, setLotes] = useState<Lote[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (id) {
          const [lotesData, userData] = await Promise.all([
            getLotesByUser(Number(id)),
            getUserById(Number(id)),
          ]);

          setLotes(lotesData);
          setUser(userData);
        }
      } catch (error) {
        console.log("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <View style={layoutStyles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={layoutStyles.screen}>
      <FlatList
        data={lotes}
        keyExtractor={(item) => item.id_lote.toString()}
        numColumns={2}
        renderItem={({ item }) => <LoteCard lote={item} />}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
              <Text style={styles.back}>Volver</Text>
            </TouchableOpacity>

            {user && (
              <Card style={styles.heroCard} contentStyle={styles.heroContent}>
                <View style={styles.heroGlow} />
                <Avatar uri={user.avatar} name={user.nombre} size={88} />
                <Text style={styles.username}>{user.nombre || "Sin nombre"}</Text>
                <Text style={styles.email}>{user.email || "Sin email"}</Text>

                <View style={styles.statsRow}>
                  <View style={styles.statPill}>
                    <Text style={styles.statValue}>{lotes.length}</Text>
                    <Text style={styles.statLabel}>
                      {lotes.length === 1 ? "lote activo" : "lotes activos"}
                    </Text>
                  </View>
                </View>
              </Card>
            )}

            <View style={layoutStyles.pageHeader}>
              <Text style={layoutStyles.headerEyebrow}>Catalogo del vendedor</Text>
              <Text style={styles.sectionTitle}>Lotes publicados</Text>
              <Text style={layoutStyles.headerSubtitle}>
                Explora los productos disponibles de este perfil.
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Este usuario aun no tiene lotes</Text>
            <Text style={styles.emptyText}>
              Vuelve mas tarde para ver nuevas publicaciones.
            </Text>
          </Card>
        }
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
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  back: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderColor: "#60A5FA",
  },
  heroContent: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.xs,
  },
  heroGlow: {
    position: "absolute",
    top: -26,
    right: -18,
    width: 170,
    height: 170,
    borderRadius: radii.full,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  username: {
    ...typography.heading,
    color: colors.white,
  },
  email: {
    ...typography.body,
    color: "#DBEAFE",
  },
  statsRow: {
    marginTop: spacing.sm,
  },
  statPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    minWidth: 140,
  },
  statValue: {
    ...typography.heading,
    color: colors.white,
  },
  statLabel: {
    ...typography.caption,
    color: "#E0F2FE",
  },
  sectionTitle: {
    ...typography.title,
    color: colors.text,
  },
  row: {
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  emptyCard: {
    marginHorizontal: spacing.lg,
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
});
