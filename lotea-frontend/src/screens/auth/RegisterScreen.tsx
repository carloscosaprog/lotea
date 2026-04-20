import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { colors } from "../../styles/colors";
import { componentStyles, layoutStyles } from "../../styles/theme";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

export default function RegisterScreen() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigation = useNavigation<any>();

  const handleRegister = async () => {
    try {
      const response = await fetch("http://192.168.0.65:3000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          email,
          contrasena: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error en registro");
      }

      Alert.alert("Usuario creado correctamente");
      navigation.navigate("Login");
    } catch (error) {
      console.error(error);
      Alert.alert("Error al registrar usuario");
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.heroGlowLarge} />
        <View style={styles.heroGlowSmall} />
        <Text style={styles.brand}>LOTEA</Text>
        <Text style={styles.heroSubtitle}>
          Crea tu cuenta para publicar, vender y gestionar lotes.
        </Text>
      </View>

      <Card style={styles.formCard}>
        <View style={styles.formSection}>
          <View style={layoutStyles.pageHeader}>
            <Text style={layoutStyles.headerEyebrow}>Nueva cuenta</Text>
            <Text style={styles.title}>Registrarse</Text>
            <Text style={layoutStyles.headerSubtitle}>
              Completa tus datos para empezar a usar LOTEA.
            </Text>
          </View>

          <TextInput
            placeholder="Nombre"
            placeholderTextColor={colors.subtext}
            style={componentStyles.input}
            value={nombre}
            onChangeText={setNombre}
          />

          <TextInput
            placeholder="Correo electronico"
            placeholderTextColor={colors.subtext}
            style={componentStyles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />

          <TextInput
            placeholder="Contraseña"
            placeholderTextColor={colors.subtext}
            secureTextEntry
            style={componentStyles.input}
            value={password}
            onChangeText={setPassword}
          />

          <Button
            title="Crear cuenta"
            variant="accent"
            onPress={handleRegister}
          />

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.link}>Ya tengo cuenta</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxl,
    justifyContent: "center",
    gap: spacing.xl,
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    padding: spacing.xl,
    overflow: "hidden",
  },
  heroGlowLarge: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: radii.full,
    backgroundColor: "rgba(255,255,255,0.14)",
    top: -76,
    right: -76,
  },
  heroGlowSmall: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: radii.full,
    backgroundColor: "rgba(147,197,253,0.32)",
    bottom: -30,
    left: -10,
  },
  brand: {
    ...typography.title,
    color: colors.white,
  },
  heroSubtitle: {
    ...typography.body,
    color: "#DBEAFE",
    marginTop: spacing.xs,
  },
  formCard: {
    borderRadius: radii.xl,
  },
  formSection: {
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  link: {
    ...typography.bodyStrong,
    color: colors.primary,
    textAlign: "center",
  },
});
