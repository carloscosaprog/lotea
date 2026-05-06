import { useCallback, useState } from "react";
import {
  Image,
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { getProfile } from "../../services/authService";
import { getMisLotes } from "../../services/lotesService";
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
  const [loading, setLoading] = useState(true);
  const [avatarOpen, setAvatarOpen] = useState(false);

  const { logout } = useAuth();
  const navigation = useNavigation<any>();

  useFocusEffect(
    useCallback(() => {
    const loadProfile = async () => {
      try {
        const [profileData, lotesData] = await Promise.all([
          getProfile(),
          getMisLotes(),
        ]);
        setUser(profileData);
        setMyLotes(lotesData);
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
        <View style={{ width: 22 }} />
        <Text style={styles.topBarTitle}>Perfil</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Text style={styles.topBarAction}>Editar</Text>
        </TouchableOpacity>
      </View>

      <Card>
        <View style={styles.profileRow}>
          <TouchableOpacity
            onPress={() => avatarUri && setAvatarOpen(true)}
            activeOpacity={0.9}
          >
            <Avatar uri={avatarUri} name={user.nombre} size={64} />
          </TouchableOpacity>

          <View style={styles.profileCopy}>
            <Text style={styles.name}>{user.nombre}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color={colors.subtext} />
        </View>
      </Card>

      <View style={styles.statsRow}>
        <Card style={styles.statCard} contentStyle={styles.statContent}>
          <Text style={styles.statValue}>{myLotes.length}</Text>
          <Text style={styles.statLabel}>Mis lotes</Text>
        </Card>
        <Card style={styles.statCard} contentStyle={styles.statContent}>
          <Text style={styles.statValue}>{totalUnits}</Text>
          <Text style={styles.statLabel}>Unidades</Text>
        </Card>
        <Card style={styles.statCard} contentStyle={styles.statContent}>
          <Text style={styles.statValue}>
            {user?.nombre ? user.nombre.length : 0}
          </Text>
          <Text style={styles.statLabel}>Perfil</Text>
        </Card>
      </View>

      {/* MIS LOTES */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate("MisLotes")}
      >
        <Card>
          <View style={styles.quickAction}>
            <View style={styles.quickActionLeft}>
              <View style={styles.quickIcon}>
                <Ionicons
                  name="cube-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.quickActionText}>Mis lotes</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.subtext} />
          </View>
        </Card>
      </TouchableOpacity>

      {/* MIS PEDIDOS */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate("MisPedidos")}
      >
        <Card>
          <View style={styles.quickAction}>
            <View style={styles.quickActionLeft}>
              <View style={styles.quickIcon}>
                <Ionicons
                  name="receipt-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.quickActionText}>Mis pedidos</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.subtext} />
          </View>
        </Card>
      </TouchableOpacity>

      {/* MIS FAVORITOS */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate("Favoritos")}
      >
        <Card>
          <View style={styles.quickAction}>
            <View style={styles.quickActionLeft}>
              <View style={styles.quickIcon}>
                <Ionicons
                  name="heart-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.quickActionText}>Mis favoritos</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.subtext} />
          </View>
        </Card>
      </TouchableOpacity>

      {/* MIS CONVERSACIONES */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate("Conversations")}
      >
        <Card>
          <View style={styles.quickAction}>
            <View style={styles.quickActionLeft}>
              <View style={styles.quickIcon}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.quickActionText}>Mis conversaciones</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.subtext} />
          </View>
        </Card>
      </TouchableOpacity>

      <Card>
        <View style={styles.accountSection}>
          <View style={styles.accountIcon}>
            <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.accountCopy}>
            <Text style={styles.accountTitle}>Tu perfil publico</Text>
            <Text style={styles.accountText}>
              Mantén tu nombre y tu avatar actualizados desde Editar.
            </Text>
          </View>
          <Button title="Cerrar sesion" variant="danger" onPress={logout} />
        </View>
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
    alignItems: "flex-start",
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
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionText: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  accountSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  accountCopy: {
    flex: 1,
    gap: 2,
  },
  accountTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  accountText: {
    ...typography.caption,
    color: colors.subtext,
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
  feedbackText: {
    ...typography.body,
    color: colors.subtext,
    textAlign: "center",
    marginTop: spacing.xs,
  },
});
