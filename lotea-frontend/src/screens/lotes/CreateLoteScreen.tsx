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

import { createLote } from "../../services/lotesService";
import { getCategorias } from "../../services/categoriasService";
import ImageUploader from "../../components/lotes/ImageUploader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { colors } from "../../styles/colors";
import { componentStyles } from "../../styles/theme";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

interface Categoria {
  id_categoria: number;
  nombre: string;
}

export default function CreateLoteScreen() {
  const navigation = useNavigation<any>();

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    precio: "",
    cantidad: "",
    id_categoria: "",
  });

  const [images, setImages] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const data = await getCategorias();
        setCategorias(data);
      } catch (error) {
        console.error("Error al cargar categorias:", error);
      }
    };

    fetchCategorias();
  }, []);

  const handleChange = (name: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!form.titulo || !form.precio || !form.cantidad || !form.id_categoria) {
      Alert.alert("Completa todos los campos obligatorios");
      return;
    }

    if (images.length === 0) {
      Alert.alert("Debes anadir al menos una imagen");
      return;
    }

    try {
      await createLote(
        {
          titulo: form.titulo,
          descripcion: form.descripcion,
          precio: Number(form.precio),
          cantidad: Number(form.cantidad),
          id_categoria: Number(form.id_categoria),
        },
        images,
      );

      navigation.navigate("Home", {
        screen: "HomeMain",
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Error al crear lote");
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        contentInset={{ bottom: 120 }}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Publicar lote</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Card>
          <ImageUploader onChange={setImages} />
        </Card>

        <Card contentStyle={styles.formCardContent}>
          <View style={styles.formSection}>
            <Text style={styles.label}>Titulo</Text>
            <TextInput
              placeholder="Titulo del lote"
              placeholderTextColor={colors.subtext}
              style={componentStyles.input}
              value={form.titulo}
              onChangeText={(text) => handleChange("titulo", text)}
            />

            <Text style={styles.label}>Descripcion</Text>
            <TextInput
              placeholder="Describe el contenido del lote"
              placeholderTextColor={colors.subtext}
              style={[componentStyles.input, styles.multilineInput]}
              multiline
              textAlignVertical="top"
              value={form.descripcion}
              onChangeText={(text) => handleChange("descripcion", text)}
            />

            <View style={styles.inlineFields}>
              <View style={styles.inlineField}>
                <Text style={styles.label}>Precio</Text>
                <TextInput
                  placeholder="EUR"
                  placeholderTextColor={colors.subtext}
                  keyboardType="numeric"
                  style={componentStyles.input}
                  value={form.precio}
                  onChangeText={(text) => handleChange("precio", text)}
                />
              </View>

              <View style={styles.inlineField}>
                <Text style={styles.label}>Unidades disponibles</Text>
                <TextInput
                  placeholder="Cantidad"
                  placeholderTextColor={colors.subtext}
                  keyboardType="numeric"
                  style={componentStyles.input}
                  value={form.cantidad}
                  onChangeText={(text) => handleChange("cantidad", text)}
                />
              </View>
            </View>

            <Text style={styles.label}>Categoria</Text>
            <View style={styles.categoryWrap}>
              {categorias.map((cat) => {
                const selected = form.id_categoria === String(cat.id_categoria);

                return (
                  <TouchableOpacity
                    key={cat.id_categoria}
                    activeOpacity={0.85}
                    style={[
                      styles.categoryItem,
                      selected && styles.categorySelected,
                    ]}
                    onPress={() =>
                      handleChange("id_categoria", String(cat.id_categoria))
                    }
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        selected && styles.categoryTextSelected,
                      ]}
                    >
                      {cat.nombre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.ctaHelper}>
          Revisa las fotos y los datos antes de publicar tu lote.
        </Text>
        <Button
          title="Publicar lote"
          onPress={handleSubmit}
          style={styles.ctaButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 140,
    gap: spacing.xl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  screenTitle: {
    ...typography.heading,
    color: colors.text,
  },
  headerSpacer: {
    width: 22,
    height: 22,
  },
  formCardContent: {
    paddingBottom: 100, // se puede ir aumentando el valor para hacer el card mas grande
  },
  formSection: {
    gap: spacing.md,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  multilineInput: {
    minHeight: 120,
    paddingTop: spacing.md,
  },
  inlineFields: {
    flexDirection: "row",
    gap: spacing.md,
  },
  inlineField: {
    flex: 1,
    gap: spacing.xs,
  },
  categoryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  categoryItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  categorySelected: {
    backgroundColor: "#DBEAFE",
    borderColor: colors.primary,
  },
  categoryText: {
    ...typography.caption,
    color: colors.text,
  },
  categoryTextSelected: {
    color: colors.primary,
    fontWeight: "700",
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
    gap: spacing.sm,
  },
  ctaHelper: {
    ...typography.caption,
    color: colors.subtext,
    textAlign: "center",
  },
  ctaButton: {
    minHeight: 58,
    borderRadius: radii.lg,
  },
});
