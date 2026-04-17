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
import { componentStyles, layoutStyles } from "../../styles/theme";
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
    <ScrollView
      style={layoutStyles.screen}
      contentContainerStyle={layoutStyles.screenContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Create/Edit Lote</Text>
        <TouchableOpacity activeOpacity={0.8} onPress={handleSubmit}>
          <Text style={styles.saveLink}>Save</Text>
        </TouchableOpacity>
      </View>

      <Card>
        <ImageUploader onChange={setImages} />
      </Card>

      <Card>
        <View style={styles.formSection}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            placeholder="Title"
            placeholderTextColor={colors.subtext}
            style={componentStyles.input}
            value={form.titulo}
            onChangeText={(text) => handleChange("titulo", text)}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            placeholder="Description"
            placeholderTextColor={colors.subtext}
            style={[componentStyles.input, styles.multilineInput]}
            multiline
            textAlignVertical="top"
            value={form.descripcion}
            onChangeText={(text) => handleChange("descripcion", text)}
          />

          <View style={styles.inlineFields}>
            <View style={styles.inlineField}>
              <Text style={styles.label}>Price</Text>
              <TextInput
                placeholder="Units"
                placeholderTextColor={colors.subtext}
                keyboardType="numeric"
                style={componentStyles.input}
                value={form.precio}
                onChangeText={(text) => handleChange("precio", text)}
              />
            </View>

            <View style={styles.inlineField}>
              <Text style={styles.label}>Units Available</Text>
              <TextInput
                placeholder="Quantity"
                placeholderTextColor={colors.subtext}
                keyboardType="numeric"
                style={componentStyles.input}
                value={form.cantidad}
                onChangeText={(text) => handleChange("cantidad", text)}
              />
            </View>
          </View>

          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryWrap}>
            {categorias.map((cat) => {
              const selected = form.id_categoria === String(cat.id_categoria);

              return (
                <TouchableOpacity
                  key={cat.id_categoria}
                  activeOpacity={0.85}
                  style={[styles.categoryItem, selected && styles.categorySelected]}
                  onPress={() => handleChange("id_categoria", String(cat.id_categoria))}
                >
                  <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>
                    {cat.nombre}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Button title="Save" onPress={handleSubmit} />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  screenTitle: {
    ...typography.heading,
    color: colors.text,
  },
  saveLink: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  formSection: {
    gap: spacing.md,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  multilineInput: {
    minHeight: 108,
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
});
