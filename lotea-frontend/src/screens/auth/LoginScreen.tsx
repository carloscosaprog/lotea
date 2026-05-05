import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { colors } from "../../styles/colors";
import { componentStyles, layoutStyles } from "../../styles/theme";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";
import { API_URL } from "../../config/api";

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigation = useNavigation<any>();

  const handleLogin = async () => {
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Se envía el email y la contraseña en el formato que espera el backend
        body: JSON.stringify({
          email: identifier,
          contrasena: password,
        }),
      });

      const data = await response.json();

      // Se adapta el manejo de errores al formato típico de NestJS (message)
      if (!response.ok) {
        throw new Error(data.message || data.error || "Error en login");
      }

      // Se guarda el JWT usando la clave correcta devuelta por el backend
      await AsyncStorage.setItem("token", data.access_token);

      // Se guarda el usuario en el contexto global para uso posterior en la app
      login(data.user);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error inesperado");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          contentContainerStyle={styles.screenContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <View style={styles.heroGlowLarge} />
            <View style={styles.heroGlowSmall} />
            <Text style={styles.brand}>LOTEA</Text>
            <Text style={styles.heroSubtitle}>
              Accede para gestionar tus lotes y seguir vendiendo.
            </Text>
          </View>

          <Card style={styles.formCard}>
            <View style={styles.formSection}>
              <View style={layoutStyles.pageHeader}>
                <Text style={layoutStyles.headerEyebrow}>Bienvenido</Text>
                <Text style={styles.title}>Iniciar sesion</Text>
                <Text style={layoutStyles.headerSubtitle}>
                  Entra con tu correo y tu contraseña para continuar.
                </Text>
              </View>

              <TextInput
                placeholder="Correo electronico"
                placeholderTextColor={colors.subtext}
                style={[
                  componentStyles.input,
                  error ? styles.inputError : null,
                ]}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
              />

              <TextInput
                placeholder="Contraseña"
                placeholderTextColor={colors.subtext}
                secureTextEntry
                style={[
                  componentStyles.input,
                  error ? styles.inputError : null,
                ]}
                value={password}
                onChangeText={setPassword}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Button
                title="Entrar"
                onPress={handleLogin}
                style={styles.primaryButton}
              />

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate("Register")}
              >
                <Text style={styles.link}>Crear cuenta</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenContent: {
    flexGrow: 1,
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
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    textAlign: "center",
  },
  primaryButton: {
    marginTop: spacing.xs,
  },
  link: {
    ...typography.bodyStrong,
    color: colors.primary,
    textAlign: "center",
  },
});
