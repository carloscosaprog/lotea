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
import {
  getCalificacionesByVendedor,
  getResumenCalificaciones,
} from "../../services/calificacionesService";
import LoteCard from "../../components/lotes/LoteCardUserProfile";
import Avatar from "../../components/ui/Avatar";
import Card from "../../components/ui/Card";
import RatingStars from "../../components/ui/RatingStars";
import type { Lote } from "../../types/Lote";
import type {
  Calificacion,
  ResumenCalificaciones,
} from "../../types/Calificacion";
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
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);
  const [resumenCalificaciones, setResumenCalificaciones] =
    useState<ResumenCalificaciones>({
      media: 0,
      total: 0,
      distribucion: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
    });
  const [loading, setLoading] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (id) {
          const [
            lotesData,
            userData,
            calificacionesData,
            resumenCalificacionesData,
          ] = await Promise.all([
            getLotesByUser(Number(id)),
            getUserById(Number(id)),
            getCalificacionesByVendedor(Number(id)),
            getResumenCalificaciones(Number(id)),
          ]);

          setLotes(lotesData);
          setUser(userData);
          setCalificaciones(calificacionesData);
          setResumenCalificaciones(resumenCalificacionesData);
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
  const homeFluidBackground = require("../../assets/backgrounds/home-fluid-bg.png");
  const maxDistribucion = Math.max(
    1,
    ...Object.values(resumenCalificaciones.distribucion),
  );
  const visibleReviews = showAllReviews
    ? calificaciones
    : calificaciones.slice(0, 3);

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

                      <RatingStars
                        value={resumenCalificaciones.media}
                        total={resumenCalificaciones.total}
                        showValue
                        style={styles.heroRating}
                      />
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

            <View style={styles.reviewsSection}>
              <View style={layoutStyles.pageHeader}>
                <Text style={layoutStyles.headerEyebrow}>Reputacion</Text>
                <Text style={styles.sectionTitle}>Calificaciones</Text>
                <Text style={layoutStyles.headerSubtitle}>
                  Opiniones verificadas de compradores con pedidos entregados.
                </Text>
              </View>

              <Card contentStyle={styles.summaryCardContent}>
                <View style={styles.summaryTop}>
                  <View>
                    <Text style={styles.summaryValue}>
                      {resumenCalificaciones.media.toFixed(1)}
                    </Text>
                    <RatingStars value={resumenCalificaciones.media} />
                  </View>

                  <Text style={styles.summaryTotal}>
                    {resumenCalificaciones.total}{" "}
                    {resumenCalificaciones.total === 1
                      ? "valoracion"
                      : "valoraciones"}
                  </Text>
                </View>

                <View style={styles.distributionList}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count =
                      resumenCalificaciones.distribucion[
                        star as 1 | 2 | 3 | 4 | 5
                      ];

                    return (
                      <View key={star} style={styles.distributionRow}>
                        <Text style={styles.distributionLabel}>
                          {star} estrellas
                        </Text>
                        <View style={styles.distributionTrack}>
                          <View
                            style={[
                              styles.distributionFill,
                              {
                                width: `${(count / maxDistribucion) * 100}%`,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.distributionCount}>{count}</Text>
                      </View>
                    );
                  })}
                </View>
              </Card>

              <Text style={styles.recentReviewsTitle}>Últimas opiniones</Text>

              {visibleReviews.length > 0 ? (
                <>
                  {visibleReviews.map((calificacion) => (
                    <Card
                      key={calificacion.id_calificacion}
                      contentStyle={styles.reviewCardContent}
                    >
                      <View style={styles.reviewTopRow}>
                        <View style={styles.reviewBuyer}>
                          <Avatar
                            uri={
                              calificacion.comprador?.avatar
                                ? getImageUrl(calificacion.comprador.avatar)
                                : null
                            }
                            name={calificacion.comprador?.nombre}
                            size={42}
                          />

                          <View style={styles.reviewBuyerCopy}>
                            <Text style={styles.reviewBuyerName}>
                              {calificacion.comprador?.nombre ?? "Comprador"}
                            </Text>

                            <Text style={styles.reviewDate}>
                              {new Date(
                                calificacion.fecha_creacion,
                              ).toLocaleDateString()}
                            </Text>
                          </View>
                        </View>

                        <RatingStars value={calificacion.puntuacion} />
                      </View>

                      <Text style={styles.reviewComment}>
                        {calificacion.comentario ||
                          "El comprador no añadió comentario."}
                      </Text>
                    </Card>
                  ))}

                  {calificaciones.length > 3 && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.showMoreButton}
                      onPress={() => setShowAllReviews((prev) => !prev)}
                    >
                      <Text style={styles.showMoreText}>
                        {showAllReviews
                          ? "Mostrar menos opiniones"
                          : `Ver las ${calificaciones.length - 3} opiniones restantes`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <Card contentStyle={styles.reviewCardContent}>
                  <Text style={styles.emptyTitle}>
                    Este vendedor aún no tiene calificaciones
                  </Text>

                  <Text style={styles.emptyText}>
                    Las opiniones aparecerán aquí tras pedidos entregados.
                  </Text>
                </Card>
              )}
            </View>

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
  heroRating: {
    marginTop: spacing.xs,
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
  reviewsSection: {
    gap: spacing.md,
  },
  summaryCardContent: {
    gap: spacing.md,
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  summaryValue: {
    ...typography.display,
    color: colors.text,
    fontWeight: "800",
  },
  summaryTotal: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  distributionList: {
    gap: spacing.sm,
  },
  distributionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  distributionLabel: {
    ...typography.caption,
    color: colors.subtext,
    width: 78,
  },
  distributionTrack: {
    flex: 1,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  distributionFill: {
    height: "100%",
    borderRadius: radii.full,
    backgroundColor: colors.primary,
  },
  distributionCount: {
    ...typography.caption,
    color: colors.text,
    width: 24,
    textAlign: "right",
  },
  reviewCardContent: {
    gap: spacing.md,
  },
  reviewTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  reviewBuyer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  reviewBuyerCopy: {
    flex: 1,
  },
  reviewBuyerName: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  reviewDate: {
    ...typography.caption,
    color: colors.subtext,
  },
  reviewComment: {
    ...typography.body,
    color: colors.subtext,
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
  footerReviews: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },

  reviewsToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  reviewsToggleTitle: {
    ...typography.bodyStrong,
    color: colors.text,
    fontWeight: "800",
  },

  reviewsToggleSubtitle: {
    ...typography.caption,
    color: colors.subtext,
    marginTop: 2,
  },
  showMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },

  showMoreText: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  recentReviewsTitle: {
    ...typography.bodyStrong,
    color: colors.text,
    fontWeight: "800",
  },
});
