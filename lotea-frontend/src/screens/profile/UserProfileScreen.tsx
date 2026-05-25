import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";

import { getLotesByUser } from "../../services/lotesService";
import { getUserById } from "../../services/authService";
import LoteCard from "../../components/lotes/LoteCardUserProfile";
import Avatar from "../../components/ui/Avatar";
import Card from "../../components/ui/Card";
import type { Lote } from "../../types/Lote";
import { colors } from "../../styles/colors";
import { layoutStyles } from "../../styles/theme";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";
import { getImageUrl } from "../../utils/getImageUrl";

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

  const totalUnits = lotes.reduce(
    (sum, lote) => sum + Number(lote.cantidad || 0),
    0,
  );
  const avatarUri = user?.avatar ? getImageUrl(user.avatar) : null;
  const homeFluidBackground = require("../../assets/backgrounds/home-fluid-bg.png");

  return (
    <View style={layoutStyles.screen}>
      <FlatList
        data={lotes}
        keyExtractor={(item) => item.id_lote.toString()}
        renderItem={({ item }) => <LoteCard lote={item} />}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <View style={styles.topBar}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-back" size={22} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.topBarTitle}>Perfil del vendedor</Text>
              <View style={{ width: 22 }} />
            </View>

            {user && (
              <ImageBackground
                source={homeFluidBackground}
                style={styles.heroCard}
                imageStyle={styles.heroBackgroundImage}
              >
                <View style={styles.heroOverlay}>
                  <View style={styles.heroHeader}>
                    <Avatar
                      uri={user.avatar ? getImageUrl(user.avatar) : null}
                      name={user.nombre}
                      size={88}
                    />

                    <View style={styles.heroProfileCopy}>
                      <Text style={styles.username}>
                        {user.nombre || "Sin nombre"}
                      </Text>

                      <Text style={styles.email}>
                        {user.email || "Sin email"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.heroStatsRow}>
                    <View style={styles.heroStat}>
                      <Text style={styles.heroStatValue}>{lotes.length}</Text>

                      <Text style={styles.heroStatLabel}>
                        {lotes.length === 1 ? "Lote activo" : "Lotes activos"}
                      </Text>
                    </View>

                    <View style={styles.heroStat}>
                      <Text style={styles.heroStatValue}>{totalUnits}</Text>

                      <Text style={styles.heroStatLabel}>Unidades</Text>
                    </View>
                  </View>
                </View>
              </ImageBackground>
            )}

            <View style={layoutStyles.pageHeader}>
              <Text style={layoutStyles.headerEyebrow}>
                Catálogo del vendedor
              </Text>
              <Text style={styles.sectionTitle}>Lotes publicados</Text>
              <Text style={layoutStyles.headerSubtitle}>
                Explora los productos disponibles de este perfil.
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              Este usuario aún no tiene lotes
            </Text>
            <Text style={styles.emptyText}>
              Vuelve más tarde para ver nuevas publicaciones.
            </Text>
          </Card>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#EFF6FF",
  },
  topBarTitle: {
    ...typography.heading,
    color: colors.text,
    fontWeight: "800",
    fontSize: 18,
  },
  loadingText: {
    ...typography.body,
    color: colors.subtext,
    marginTop: spacing.sm,
  },
  headerWrap: {
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  heroCard: {
    borderRadius: radii.xl,
    overflow: "hidden",
    minHeight: 240,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  heroBackgroundImage: {
    borderRadius: radii.xl,
  },

  heroOverlay: {
    flex: 1,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: "rgba(255,255,255,0.72)",
    gap: spacing.lg,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  heroProfileCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  username: {
    ...typography.title,
    color: colors.text,
    fontWeight: "800",
  },
  email: {
    ...typography.body,
    color: colors.subtext,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.subtext,
    lineHeight: 22,
  },
  heroStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  heroStat: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: "rgba(255,255,255,0.72)",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },
  heroStatValue: {
    ...typography.heading,
    color: colors.primary,
    fontWeight: "800",
    marginBottom: spacing.xs,
  },
  heroStatLabel: {
    ...typography.caption,
    color: colors.subtext,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statsRow: {
    marginTop: spacing.sm,
  },
  statPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    minWidth: 140,
  },
  statValue: {
    ...typography.heading,
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.primary,
  },
  sectionTitle: {
    ...typography.title,
    color: colors.text,
    marginTop: spacing.sm,
  },
  emptyCard: {
    marginHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#E0ECFF",
    backgroundColor: colors.white,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
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
