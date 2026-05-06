import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";

import {
  getProfile,
  removeAvatar,
  updateProfile,
  uploadAvatar,
} from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { colors } from "../../styles/colors";
import { componentStyles, layoutStyles } from "../../styles/theme";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";
import { getImageUrl } from "../../utils/getImageUrl";

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { login } = useAuth();

  const [user, setUser] = useState<any>(null);
  const [nombre, setNombre] = useState("");
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [removeCurrentAvatar, setRemoveCurrentAvatar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getProfile();
        setUser(profile);
        setNombre(profile.nombre ?? "");
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "No se pudo cargar tu perfil");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permiso necesario", "Necesitamos acceso a tus fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setRemoveCurrentAvatar(false);
      setSelectedImage(result.assets[0]);
    }
  };

  const handleRemoveAvatar = () => {
    setSelectedImage(null);
    setRemoveCurrentAvatar(true);
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      Alert.alert("El nombre no puede estar vacio");
      return;
    }

    try {
      setSaving(true);

      let updatedUser = await updateProfile(nombre.trim());

      if (selectedImage) {
        updatedUser = await uploadAvatar(selectedImage);
      } else if (removeCurrentAvatar && user?.avatar) {
        updatedUser = await removeAvatar();
      }

      await login(updatedUser);
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudieron guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={layoutStyles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.feedbackTitle}>Cargando perfil...</Text>
      </View>
    );
  }

  const avatarUri =
    selectedImage?.uri ||
    (!removeCurrentAvatar && user?.avatar ? getImageUrl(user.avatar) : null);

  return (
    <View style={layoutStyles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Editar perfil</Text>
          <View style={{ width: 22 }} />
        </View>

        <Card style={styles.heroCard} contentStyle={styles.heroContent}>
          <View style={styles.heroGlow} />
          <TouchableOpacity activeOpacity={0.9} onPress={pickAvatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Avatar name={nombre || user?.nombre} size={112} />
            )}
            <View style={styles.cameraBubble}>
              <Ionicons name="camera" size={18} color={colors.white} />
            </View>
          </TouchableOpacity>

          <Text style={styles.heroTitle}>{nombre || "Tu nombre"}</Text>
          <Text style={styles.heroSubtitle}>
            Personaliza como te ven compradores y vendedores.
          </Text>
        </Card>

        <Card contentStyle={styles.formCard}>
          <View style={styles.labelRow}>
            <Text style={componentStyles.inputLabel}>Nombre visible</Text>
            <Text style={styles.optionalText}>Editable</Text>
          </View>
          <TextInput
            value={nombre}
            onChangeText={setNombre}
            style={componentStyles.input}
            placeholder="Tu nombre"
            placeholderTextColor={colors.subtext}
          />

          <TouchableOpacity style={styles.avatarAction} onPress={pickAvatar}>
            <View style={styles.avatarActionIcon}>
              <Ionicons name="image-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.avatarActionCopy}>
              <Text style={styles.avatarActionTitle}>Cambiar foto</Text>
              <Text style={styles.avatarActionText}>
                Elige una imagen cuadrada y clara para tu perfil.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.subtext} />
          </TouchableOpacity>

          {(avatarUri || user?.avatar) && (
            <TouchableOpacity
              style={styles.removeAvatarAction}
              onPress={handleRemoveAvatar}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
              <Text style={styles.removeAvatarText}>Quitar foto de perfil</Text>
            </TouchableOpacity>
          )}
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={saving ? "Guardando..." : "Guardar cambios"}
          disabled={saving}
          onPress={handleSave}
          style={styles.saveButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 140,
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
  heroCard: {
    backgroundColor: colors.primary,
    borderColor: "#60A5FA",
  },
  heroContent: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    top: -40,
    right: -34,
    width: 180,
    height: 180,
    borderRadius: radii.full,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  avatarImage: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: colors.white,
  },
  cameraBubble: {
    position: "absolute",
    right: 0,
    bottom: 2,
    width: 38,
    height: 38,
    borderRadius: radii.full,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.white,
  },
  heroTitle: {
    ...typography.title,
    color: colors.white,
    marginTop: spacing.sm,
  },
  heroSubtitle: {
    ...typography.body,
    color: "#DBEAFE",
    textAlign: "center",
  },
  formCard: {
    gap: spacing.md,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionalText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
  },
  avatarAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    backgroundColor: "#F8FAFC",
  },
  avatarActionIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.full,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarActionCopy: {
    flex: 1,
    gap: 2,
  },
  avatarActionTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  avatarActionText: {
    ...typography.caption,
    color: colors.subtext,
  },
  removeAvatarAction: {
    minHeight: 48,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  removeAvatarText: {
    ...typography.bodyStrong,
    color: colors.danger,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    backgroundColor: "rgba(249,250,251,0.98)",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    minHeight: 58,
    borderRadius: radii.lg,
  },
  feedbackTitle: {
    ...typography.heading,
    color: colors.text,
    marginTop: spacing.sm,
  },
});
