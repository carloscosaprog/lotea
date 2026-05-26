import { useCallback, useEffect, useState } from "react";
import {
  Image,
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { getProfile } from "../../services/authService";
import { getConversations } from "../../services/chatService";
import { getMisLotes } from "../../services/lotesService";
import { getPedidos, getVentas } from "../../services/pedidosService";
import { useAuth } from "../../context/AuthContext";
import type { Lote } from "../../types/Lote";
import Avatar from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { colors } from "../../styles/colors";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";
import { layoutStyles } from "../../styles/theme";
import { getImageUrl } from "../../utils/getImageUrl";

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [myLotes, setMyLotes] = useState<Lote[]>([]);
  const [misPedidos, setMisPedidos] = useState<any[]>([]);
  const [misVentas, setMisVentas] = useState<any[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [avatarOpen, setAvatarOpen] = useState(false);

  const { logout } = useAuth();
  const navigation = useNavigation<any>();
  const loadUnreadMessages = async () => {
    try {
      const conversationsData = await getConversations();

      setUnreadMessages(
        conversationsData.reduce(
          (total, conversation) => total + (conversation.unreadCount ?? 0),
          0,
        ),
      );
    } catch (error) {
      console.error("Error cargando conversaciones:", error);
    }
  };
  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        try {
          const [
            profileData,
            lotesData,
            pedidosData,
            ventasData,
            conversationsData,
          ] = await Promise.all([
            getProfile(),
            getMisLotes(),
            getPedidos(),
            getVentas(),
            getConversations(),
          ]);
          setUser(profileData);
          setMyLotes(lotesData);
          setMisPedidos(pedidosData);
          setMisVentas(ventasData);

          await loadUnreadMessages();
        } catch (error) {
          console.error(error);
          Alert.alert("Error al cargar perfil");
        } finally {
          setLoading(false);
        }
      };

      loadProfile();
    }, []),
  );
  useEffect(() => {
    const interval = setInterval(() => {
      loadUnreadMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <View style={layoutStyles.center}>
        <Text style={styles.feedbackTitle}>Cargando perfil...</Text>
        <Text style={styles.feedbackText}>
          Preparando tu panel de vendedor.
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={layoutStyles.center}>
        <Text style={styles.feedbackTitle}>Perfil no disponible</Text>
        <Text style={styles.feedbackText}>
          Intentalo de nuevo en unos segundos.
        </Text>
      </View>
    );
  }

  const totalUnits = myLotes.reduce((sum, lote) => sum + lote.cantidad, 0);
  const avatarUri = user.avatar ? getImageUrl(user.avatar) : null;

  return (
    <ScrollView
      style={layoutStyles.screen}
      contentContainerStyle={layoutStyles.screenContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Perfil</Text>
      </View>
      <Card>
        <Pressable
          onPress={() => navigation.navigate("EditProfile")}
          style={({ pressed }) => [
            styles.profilePressable,
            pressed && styles.profilePressablePressed,
          ]}
          android_ripple={{ color: "rgba(59,130,246,0.08)" }}
        >
          <View style={styles.profileRow}>
            <TouchableOpacity onPress={() => avatarUri && setAvatarOpen(true)}>
              <Avatar uri={avatarUri} name={user.nombre} size={64} />
            </TouchableOpacity>

            <View style={styles.profileCopy}>
              <Text style={styles.name}>{user.nombre}</Text>
              <Text style={styles.email}>{user.email}</Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
          </View>
        </Pressable>
      </Card>

      <View style={styles.statsRow}>
        <Card style={styles.statCard} contentStyle={styles.statContent}>
          <Text style={styles.statValue}>{myLotes.length}</Text>
          <Text style={styles.statLabel}>Mis lotes</Text>
        </Card>

        <Card style={styles.statCard} contentStyle={styles.statContent}>
          <Text style={styles.statValue}>{misPedidos.length}</Text>
          <Text style={styles.statLabel}>Mis pedidos</Text>
        </Card>

        <Card style={styles.statCard} contentStyle={styles.statContent}>
          <Text style={styles.statValue}>{misVentas.length}</Text>
          <Text style={styles.statLabel}>Mis ventas</Text>
        </Card>
      </View>

      {/* MIS LOTES */}
      <Card>
        <Pressable
          onPress={() => navigation.navigate("MisLotes")}
          style={({ pressed }) => [
            styles.actionPressable,
            pressed && styles.actionPressablePressed,
          ]}
          android_ripple={{ color: "rgba(59,130,246,0.08)" }}
        >
          <View style={styles.quickAction}>
            <View style={styles.quickActionLeft}>
              <View style={styles.quickIcon}>
                <Ionicons
                  name="cube-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.quickActionText}>Mis lotes</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
          </View>
        </Pressable>
      </Card>

      {/* MIS PEDIDOS */}
      <Card>
        <Pressable
          onPress={() => navigation.navigate("MisPedidos")}
          style={({ pressed }) => [
            styles.actionPressable,
            pressed && styles.actionPressablePressed,
          ]}
          android_ripple={{ color: "rgba(59,130,246,0.08)" }}
        >
          <View style={styles.quickAction}>
            <View style={styles.quickActionLeft}>
              <View style={styles.quickIcon}>
                <Ionicons
                  name="receipt-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.quickActionText}>Mis pedidos</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
          </View>
        </Pressable>
      </Card>

      {/* MIS VENTAS */}
      <Card>
        <Pressable
          onPress={() => navigation.navigate("MisVentas")}
          style={({ pressed }) => [
            styles.actionPressable,
            pressed && styles.actionPressablePressed,
          ]}
          android_ripple={{ color: "rgba(59,130,246,0.08)" }}
        >
          <View style={styles.quickAction}>
            <View style={styles.quickActionLeft}>
              <View style={styles.quickIcon}>
                <Ionicons
                  name="bag-check-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.quickActionText}>Mis ventas</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
          </View>
        </Pressable>
      </Card>

      {/* MI UBICACION */}
      <Card>
        <Pressable
          onPress={() => navigation.navigate("EditLocation")}
          style={({ pressed }) => [
            styles.actionPressable,
            pressed && styles.actionPressablePressed,
          ]}
          android_ripple={{ color: "rgba(59,130,246,0.08)" }}
        >
          <View style={styles.quickAction}>
            <View style={styles.quickActionLeft}>
              <View style={styles.quickIcon}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View>
                <Text style={styles.quickActionText}>Mi ubicacion</Text>
                <Text style={styles.quickActionHint}>
                  {user?.ciudad || "Elige tu zona de venta"}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
          </View>
        </Pressable>
      </Card>

      {/* MIS FAVORITOS */}
      <Card>
        <Pressable
          onPress={() => navigation.navigate("Favoritos")}
          style={({ pressed }) => [
            styles.actionPressable,
            pressed && styles.actionPressablePressed,
          ]}
          android_ripple={{ color: "rgba(59,130,246,0.08)" }}
        >
          <View style={styles.quickAction}>
            <View style={styles.quickActionLeft}>
              <View style={styles.quickIcon}>
                <Ionicons
                  name="heart-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.quickActionText}>Mis favoritos</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
          </View>
        </Pressable>
      </Card>

      {/* MIS CONVERSACIONES */}
      <Card>
        <Pressable
          onPress={() => navigation.navigate("Conversations")}
          style={({ pressed }) => [
            styles.actionPressable,
            pressed && styles.actionPressablePressed,
          ]}
          android_ripple={{ color: "rgba(59,130,246,0.08)" }}
        >
          <View style={styles.quickAction}>
            <View style={styles.quickActionLeft}>
              <View style={styles.quickIcon}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.quickActionText}>Mis conversaciones</Text>
              {unreadMessages > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadMessages > 99 ? "99+" : unreadMessages}
                  </Text>
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
          </View>
        </Pressable>
      </Card>

      <Card>
        <View style={styles.accountCopy}>
          <Text style={styles.accountTitle}>Cerrar sesión</Text>

          <Text style={styles.accountText}>
            Finaliza la sesión de este dispositivo.
          </Text>
        </View>
        <Button
          title="Cerrar sesión"
          variant="danger"
          onPress={logout}
          style={styles.logoutButton}
          textStyle={styles.logoutButtonText}
        />
      </Card>

      <Modal visible={avatarOpen} transparent animationType="fade">
        <View style={styles.avatarModal}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setAvatarOpen(false)}
          >
            <Ionicons name="close" size={24} color={colors.white} />
          </TouchableOpacity>

          {avatarUri && (
            <Image source={{ uri: avatarUri }} style={styles.fullAvatar} />
          )}
          <Text style={styles.modalName}>{user.nombre}</Text>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    ...typography.heading,
    color: colors.text,
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  profileCopy: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.heading,
    color: colors.text,
  },
  email: {
    ...typography.body,
    color: colors.subtext,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  statValue: {
    ...typography.heading,
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.subtext,
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quickActionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: colors.text,
  },
  quickActionHint: {
    ...typography.caption,
    color: colors.subtext,
    marginTop: 2,
  },
  notificationBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: radii.full,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  notificationBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: "700",
  },
  accountSection: {
    gap: spacing.md,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  accountCopy: {
    flex: 1,
    gap: 2,
  },
  accountTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: colors.text,
  },
  accountText: {
    ...typography.body,
    color: colors.subtext,
    marginTop: 2,
  },
  avatarModal: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.96)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  modalClose: {
    position: "absolute",
    top: 44,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  fullAvatar: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 4,
    borderColor: colors.white,
  },
  modalName: {
    ...typography.title,
    color: colors.white,
    marginTop: spacing.lg,
  },
  feedbackTitle: {
    ...typography.heading,
    color: colors.text,
    textAlign: "center",
  },
  profilePressable: {
    borderRadius: radii.xl,
    padding: spacing.md,
  },

  profilePressablePressed: {
    backgroundColor: "rgba(59,130,246,0.06)",
    transform: [{ scale: 0.992 }],
  },

  actionPressable: {
    borderRadius: radii.xl,
  },

  actionPressablePressed: {
    backgroundColor: "rgba(59,130,246,0.06)",
    transform: [{ scale: 0.992 }],
  },
  feedbackText: {
    ...typography.body,
    color: colors.subtext,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  logoutButton: {
    marginTop: spacing.sm,

    minHeight: 52,
    borderRadius: 14,

    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",

    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  logoutButtonText: {
    color: "#DC2626",
    fontWeight: "800",
  },
});
