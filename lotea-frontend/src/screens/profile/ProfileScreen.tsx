import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";

import {
  getProfile,
  updateProfile,
  uploadAvatar,
} from "../../services/authService";
import { getMisLotes } from "../../services/lotesService";
import { useAuth } from "../../context/AuthContext";
import type { Lote } from "../../types/Lote";
import Avatar from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { colors } from "../../styles/colors";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";
import { componentStyles, layoutStyles } from "../../styles/theme";

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [nombre, setNombre] = useState("");
  const [myLotes, setMyLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const { login, logout } = useAuth();
  const navigation = useNavigation<any>();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [profileData, lotesData] = await Promise.all([
          getProfile(),
          getMisLotes(),
        ]);
        setUser(profileData);
        setNombre(profileData.nombre);
        setMyLotes(lotesData);
      } catch (error) {
        console.error(error);
        Alert.alert("Error al cargar perfil");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!nombre.trim()) {
      Alert.alert("El nombre no puede estar vacio");
      return;
    }

    try {
      setSaving(true);
      setSuccess(false);

      const updated = await updateProfile(nombre);
      setUser(updated);
      login(updated);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      console.error(error);
      Alert.alert("Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Necesitamos permiso para acceder a tus fotos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      try {
        const asset = result.assets[0];
        const response = await uploadAvatar(asset);

        const updatedUser = {
          ...user,
          avatar: response.avatar,
        };

        setUser(updatedUser);
        login(updatedUser);
      } catch (error) {
        console.log(error);
        Alert.alert("Error subiendo imagen");
      }
    }
  };

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

  return (
    <ScrollView
      style={layoutStyles.screen}
      contentContainerStyle={layoutStyles.screenContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <View style={{ width: 22 }} />
        <Text style={styles.topBarTitle}>Perfil</Text>
        <TouchableOpacity activeOpacity={0.8}>
          <Text style={styles.topBarAction}>Editar</Text>
        </TouchableOpacity>
      </View>

      <Card>
        <View style={styles.profileRow}>
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.9}>
            <Avatar uri={user.avatar} name={user.nombre} size={64} />
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
        onPress={() =>
          navigation.navigate("Perfil", {
            screen: "MisLotes",
          })
        }
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
        onPress={() =>
          navigation.navigate("Perfil", {
            screen: "MisPedidos",
          })
        }
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
        onPress={() =>
          navigation.navigate("Perfil", {
            screen: "Favoritos",
          })
        }
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
        onPress={() =>
          navigation.navigate("Perfil", {
            screen: "Conversations",
          })
        }
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
        <View style={styles.formSection}>
          <View style={styles.labelRow}>
            <Text style={componentStyles.inputLabel}>Nombre visible</Text>
            {success && (
              <View style={styles.successPill}>
                <Text style={styles.successText}>Guardado</Text>
              </View>
            )}
          </View>

          <TextInput
            value={nombre}
            onChangeText={setNombre}
            style={componentStyles.input}
            placeholder="Tu nombre"
            placeholderTextColor={colors.subtext}
          />

          <Button
            title={saving ? "Guardando..." : "Guardar cambios"}
            onPress={handleSave}
            disabled={saving}
          />

          <Button title="Cerrar sesion" variant="danger" onPress={logout} />
        </View>
      </Card>
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
  formSection: {
    gap: spacing.md,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  successPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: colors.accentSoft,
  },
  successText: {
    ...typography.caption,
    color: colors.accent,
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
