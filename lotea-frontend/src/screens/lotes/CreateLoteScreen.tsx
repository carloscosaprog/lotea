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
import { getCategoryIcon } from "../../utils/categoryIcons";

interface Categoria {
  id_categoria: number;
  nombre: string;
  slug: string;
  icono?: string;
  subcategorias?: Categoria[];
}

export default function CreateLoteScreen() {
  const navigation = useNavigation<any>();

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    precio: "",
    cantidad: "",
  });

  const [images, setImages] = useState<any[]>([]);
  const [uploaderKey, setUploaderKey] = useState(0);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<
    Categoria[]
  >([]);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<
    number[]
  >([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [categoriaActiva, setCategoriaActiva] = useState<Categoria | null>(
    null,
  );

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const data = await getCategorias();
        setCategoriasDisponibles(data);
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

  const toggleCategoria = (id_categoria: number) => {
    setCategoriasSeleccionadas((prev) =>
      prev.includes(id_categoria)
        ? prev.filter((id) => id !== id_categoria)
        : [...prev, id_categoria],
    );
  };

  const handleSubmit = async () => {
    if (
      !form.titulo ||
      !form.precio ||
      !form.cantidad ||
      categoriasSeleccionadas.length === 0
    ) {
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
          categoriasIds: categoriasSeleccionadas,
        },
        images,
      );

      // limpiar formulario
      setForm({
        titulo: "",
        descripcion: "",
        precio: "",
        cantidad: "",
      });

      // limpiar imagenes
      setImages([]);

      // limpiar categorias
      setCategoriasSeleccionadas([]);

      setUploaderKey((prev) => prev + 1);

      //Alert.alert("Lote publicado correctamente");

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
          <View style={styles.headerSpacer} />

          <Text style={styles.screenTitle}>Publicar lote</Text>

          <View style={styles.headerSpacer} />
        </View>

        <Card>
          <ImageUploader key={uploaderKey} onChange={setImages} />
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
            {currentStep === 1 && (
              <>
                <Button
                  title="Continuar"
                  onPress={() => {
                    if (!form.titulo || !form.precio || !form.cantidad) {
                      Alert.alert("Completa todos los campos obligatorios");
                      return;
                    }

                    if (images.length === 0) {
                      Alert.alert("Debes anadir al menos una imagen");
                      return;
                    }

                    setCurrentStep(2);
                  }}
                  style={styles.ctaButton}
                />
              </>
            )}

            {currentStep === 2 && (
              <>
                <Text style={styles.stepTitle}>
                  {categoriaActiva
                    ? `Selecciona una subcategoria`
                    : "Selecciona una categoria"}
                </Text>

                {categoriaActiva && (
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setCategoriaActiva(null)}
                  >
                    <Text style={styles.backButtonText}>← Volver</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.categoriesGrid}>
                  {!categoriaActiva &&
                    categoriasDisponibles.map((categoriaPadre) => {
                      const hasSubcategorias =
                        categoriaPadre.subcategorias &&
                        categoriaPadre.subcategorias.length > 0;

                      return (
                        <TouchableOpacity
                          key={categoriaPadre.id_categoria}
                          activeOpacity={0.9}
                          style={styles.categoryCard}
                          onPress={() => {
                            if (hasSubcategorias) {
                              setCategoriaActiva(categoriaPadre);
                            } else {
                              toggleCategoria(categoriaPadre.id_categoria);
                            }
                          }}
                        >
                          {(() => {
                            const Icon = getCategoryIcon(categoriaPadre.icono);

                            return (
                              <Icon
                                size={32}
                                color={colors.text}
                                strokeWidth={1.8}
                              />
                            );
                          })()}

                          <Text style={styles.categoryCardText}>
                            {categoriaPadre.nombre}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                  {categoriaActiva &&
                    categoriaActiva.subcategorias?.map((subcategoria) => {
                      const selected = categoriasSeleccionadas.includes(
                        subcategoria.id_categoria,
                      );

                      return (
                        <TouchableOpacity
                          key={subcategoria.id_categoria}
                          activeOpacity={0.9}
                          style={[
                            styles.categoryCard,
                            selected && styles.categoryCardSelected,
                          ]}
                          onPress={() =>
                            toggleCategoria(subcategoria.id_categoria)
                          }
                        >
                          {(() => {
                            console.log(
                              subcategoria.nombre,
                              subcategoria.icono,
                            );

                            const Icon = getCategoryIcon(subcategoria.icono);

                            return (
                              <Icon
                                size={32}
                                color={selected ? colors.primary : colors.text}
                                strokeWidth={1.8}
                              />
                            );
                          })()}

                          <Text
                            style={[
                              styles.categoryCardText,
                              selected && styles.categoryCardTextSelected,
                            ]}
                          >
                            {subcategoria.nombre}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </View>

                <Button
                  title="Continuar"
                  onPress={() => {
                    if (categoriasSeleccionadas.length === 0) {
                      Alert.alert("Selecciona al menos una categoria");
                      return;
                    }

                    setCurrentStep(3);
                  }}
                  style={styles.ctaButton}
                />
              </>
            )}

            {currentStep === 3 && (
              <>
                <Button
                  title="Publicar lote"
                  onPress={handleSubmit}
                  style={styles.ctaButton}
                />
              </>
            )}
          </View>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        {currentStep === 2 && (
          <>
            <Text style={styles.ctaHelper}>
              Selecciona las categorias que mejor describen el lote.
            </Text>
          </>
        )}
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
  parentCategory: {
    gap: spacing.sm,
  },

  parentCategoryTitle: {
    ...typography.bodyStrong,
    color: colors.text,
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
  stepTitle: {
    ...typography.heading,
    color: colors.text,
  },

  backButton: {
    alignSelf: "flex-start",
  },

  backButtonText: {
    ...typography.bodyStrong,
    color: colors.primary,
  },

  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  categoryCard: {
    width: "47%",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },

  categoryCardSelected: {
    borderColor: colors.primary,
    backgroundColor: "#DBEAFE",
  },

  categoryEmoji: {
    fontSize: 34,
  },

  categoryCardText: {
    ...typography.bodyStrong,
    color: colors.text,
    textAlign: "center",
  },

  categoryCardTextSelected: {
    color: colors.primary,
  },
});
