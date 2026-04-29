import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";

import { getLoteById, updateLote } from "../../services/lotesService";
import { getCategorias } from "../../services/categoriasService";
import ImageUploader from "../../components/lotes/ImageUploader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { colors } from "../../styles/colors";
import { componentStyles, layoutStyles } from "../../styles/theme";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

interface Categoria {
  id_categoria: number;
  nombre: string;
}

const BASE_URL = "http://192.168.0.65:3000";

export default function EditLoteScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id } = route.params;

  const [loading, setLoading] = useState(true);
  const [lote, setLote] = useState<any>(null);

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    precio: "",
    cantidad: "",
  });

  const [categoriasDisponibles, setCategoriasDisponibles] = useState<
    Categoria[]
  >([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<any[]>([]);

  const fixUrl = (url?: string) => {
    if (!url) return "https://picsum.photos/300";

    return url.replace("http://localhost:3000", BASE_URL);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const data: any = await getLoteById(Number(id));
        const cats = await getCategorias();

        if (data) {
          setLote(data);
          setForm({
            titulo: data.titulo,
            descripcion: data.descripcion,
            precio: String(data.precio),
            cantidad: String(data.cantidad),
          });
          setCategorias(
            Array.isArray(data.categorias) && data.categorias.length > 0
              ? data.categorias
              : data.categoria
                ? [data.categoria]
                : [],
          );
          setExistingImages(Array.isArray(data.imagenes) ? data.imagenes : []);
        }

        setCategoriasDisponibles(cats);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (name: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleCategoria = (categoria: string) => {
    setCategorias((prev) =>
      prev.includes(categoria)
        ? prev.filter((item) => item !== categoria)
        : [...prev, categoria],
    );
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((current) => current.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!lote) return;

    if (existingImages.length === 0 && newImages.length === 0) {
      Alert.alert("Debes anadir al menos una imagen");
      return;
    }

    if (categorias.length === 0) {
      Alert.alert("Selecciona al menos una categoria");
      return;
    }

    try {
      const categoriaPrincipal = categoriasDisponibles.find(
        (cat) => cat.nombre === categorias[0],
      );

      await updateLote(
        lote.id_lote,
        {
          titulo: form.titulo,
          descripcion: form.descripcion,
          precio: Number(form.precio),
          cantidad: Number(form.cantidad),
          id_categoria: categoriaPrincipal?.id_categoria,
          categoria: categorias[0],
          categorias,
          imagenes: existingImages.map((img) =>
            img.replace("http://localhost:3000", BASE_URL),
          ),
        },
        newImages,
      );

      navigation.navigate("Home", {
        screen: "LoteDetail",
        params: { id: lote.id_lote },
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Error al actualizar lote");
    }
  };

  if (loading) {
    return (
      <View style={layoutStyles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.feedbackTitle}>Cargando lote...</Text>
      </View>
    );
  }

  if (!lote) {
    return (
      <View style={layoutStyles.center}>
        <Text style={styles.feedbackTitle}>No se pudo cargar el lote</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Editar lote</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Card>
          <Text style={styles.sectionTitle}>Imagenes actuales</Text>
          <View style={styles.imageRow}>
            {existingImages.map((img, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: fixUrl(img) }} style={styles.image} />

                <TouchableOpacity
                  onPress={() => removeExistingImage(index)}
                  style={styles.removeBtn}
                >
                  <Ionicons name="close" size={14} color={colors.white} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <ImageUploader onChange={setNewImages} />
        </Card>

        <Card contentStyle={styles.formCardContent}>
          <View style={styles.formSection}>
            <Text style={styles.label}>Titulo</Text>
            <TextInput
              value={form.titulo}
              onChangeText={(text) => handleChange("titulo", text)}
              style={componentStyles.input}
              placeholder="Titulo"
              placeholderTextColor={colors.subtext}
            />

            <Text style={styles.label}>Descripcion</Text>
            <TextInput
              value={form.descripcion}
              onChangeText={(text) => handleChange("descripcion", text)}
              style={[componentStyles.input, styles.multilineInput]}
              placeholder="Descripcion"
              placeholderTextColor={colors.subtext}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.inlineFields}>
              <View style={styles.inlineField}>
                <Text style={styles.label}>Precio</Text>
                <TextInput
                  value={form.precio}
                  onChangeText={(text) => handleChange("precio", text)}
                  style={componentStyles.input}
                  placeholder="EUR"
                  placeholderTextColor={colors.subtext}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inlineField}>
                <Text style={styles.label}>Cantidad</Text>
                <TextInput
                  value={form.cantidad}
                  onChangeText={(text) => handleChange("cantidad", text)}
                  style={componentStyles.input}
                  placeholder="Cantidad"
                  placeholderTextColor={colors.subtext}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.label}>Categoria</Text>
            <View style={styles.categoryWrap}>
              {categoriasDisponibles.map((cat) => {
                const selected = categorias.includes(cat.nombre);

                return (
                  <TouchableOpacity
                    key={cat.id_categoria}
                    style={[
                      styles.categoryItem,
                      selected && styles.categorySelected,
                    ]}
                    onPress={() => toggleCategoria(cat.nombre)}
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
          Guarda los cambios cuando el lote y las imagenes esten listas.
        </Text>
        <Button
          title="Guardar cambios"
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
    paddingBottom: 220,
    gap: spacing.xl,
    flexGrow: 1,
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
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.md,
  },
  imageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: 92,
    height: 92,
    borderRadius: radii.md,
  },
  removeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: colors.danger,
    width: 24,
    height: 24,
    borderRadius: radii.full,
    justifyContent: "center",
    alignItems: "center",
  },
  formCardContent: {
    paddingBottom: 100,
  },
  formSection: {
    gap: spacing.md,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  multilineInput: {
    minHeight: 110,
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
  feedbackTitle: {
    ...typography.heading,
    color: colors.text,
    textAlign: "center",
  },
});
