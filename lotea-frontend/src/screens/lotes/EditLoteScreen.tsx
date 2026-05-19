import { useEffect, useMemo, useState } from "react";
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
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronRight,
  ImagePlus,
  Layers3,
  PackageCheck,
  PencilLine,
  Plus,
  Tag,
  Trash2,
  X,
} from "lucide-react-native";
import { useRoute, useNavigation } from "@react-navigation/native";

import {
  deleteLoteImage,
  getImagenesByLote,
  getLoteById,
  updateLote,
  uploadLoteImages,
} from "../../services/lotesService";
import { getCategorias } from "../../services/categoriasService";
import type { ImagenLote } from "../../types/Lote";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { colors } from "../../styles/colors";
import { componentStyles, layoutStyles } from "../../styles/theme";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";
import { getImageUrl } from "../../utils/getImageUrl";
import { getCategoryIcon } from "../../utils/categoryIcons";

interface Categoria {
  id_categoria: number;
  nombre: string;
  slug: string;
  icono?: string;
  subcategorias?: Categoria[];
}

type ActiveSection = "photos" | "details" | "categories";

const sectionTabs: {
  key: ActiveSection;
  label: string;
  Icon: typeof Camera;
}[] = [
  { key: "photos", label: "Fotos", Icon: Camera },
  { key: "details", label: "Datos", Icon: PencilLine },
  { key: "categories", label: "Categorias", Icon: Layers3 },
];

const flattenCategories = (categorias: Categoria[]) =>
  categorias.flatMap((categoria) => [
    categoria,
    ...(categoria.subcategorias || []),
  ]);

export default function EditLoteScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lote, setLote] = useState<any>(null);

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    precio: "",
    cantidad: "",
  });
  const [initialForm, setInitialForm] = useState(form);

  const [categoriasDisponibles, setCategoriasDisponibles] = useState<
    Categoria[]
  >([]);
  const [categorias, setCategorias] = useState<number[]>([]);
  const [initialCategorias, setInitialCategorias] = useState<number[]>([]);

  const [existingImages, setExistingImages] = useState<ImagenLote[]>([]);
  const [removedImages, setRemovedImages] = useState<ImagenLote[]>([]);
  const [newImages, setNewImages] = useState<any[]>([]);

  const [activeSection, setActiveSection] = useState<ActiveSection>("photos");
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categoriaActiva, setCategoriaActiva] = useState<Categoria | null>(
    null,
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const [data, cats, imageRecords] = await Promise.all([
          getLoteById(Number(id)),
          getCategorias(),
          getImagenesByLote(Number(id)),
        ]);

        if (data) {
          const nextForm = {
            titulo: data.titulo ?? "",
            descripcion: data.descripcion ?? "",
            precio: String(data.precio ?? ""),
            cantidad: String(data.cantidad ?? ""),
          };
          const flatCats = flattenCategories(cats);
          const categoryIds =
            data.categoriasIds && data.categoriasIds.length > 0
              ? data.categoriasIds
              : flatCats
                  .filter((cat) => data.categorias?.includes(cat.nombre))
                  .map((cat) => cat.id_categoria);
          const normalizedImages =
            imageRecords.length > 0
              ? imageRecords
              : (data.imagenes || []).map((url, index) => ({
                  id_imagen: -index - 1,
                  id_lote: data.id_lote,
                  url,
                  es_principal: index === 0,
                }));

          setLote(data);
          setForm(nextForm);
          setInitialForm(nextForm);
          setCategorias(categoryIds);
          setInitialCategorias(categoryIds);
          setExistingImages(normalizedImages);
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

  const visibleExistingImages = existingImages.filter(
    (img) =>
      !removedImages.some((removed) => removed.id_imagen === img.id_imagen),
  );
  const visibleImageCount = visibleExistingImages.length + newImages.length;

  const allCategories = useMemo(
    () => flattenCategories(categoriasDisponibles),
    [categoriasDisponibles],
  );
  const selectedCategoriesData = allCategories.filter((cat) =>
    categorias.includes(cat.id_categoria),
  );

  const hasFormChanges = Object.keys(form).some(
    (key) =>
      form[key as keyof typeof form] !==
      initialForm[key as keyof typeof initialForm],
  );
  const hasCategoryChanges =
    categorias.length !== initialCategorias.length ||
    categorias.some((cat) => !initialCategorias.includes(cat));
  const changesCount =
    (hasFormChanges ? 1 : 0) +
    (hasCategoryChanges ? 1 : 0) +
    removedImages.length +
    newImages.length;

  const coverImage = visibleExistingImages[0]
    ? getImageUrl(visibleExistingImages[0].url)
    : newImages[0]?.uri;

  const handleChange = (name: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleCategoria = (id_categoria: number) => {
    setCategorias((prev) =>
      prev.includes(id_categoria)
        ? prev.filter((item) => item !== id_categoria)
        : [...prev, id_categoria],
    );
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.9,
    });

    if (!result.canceled) {
      setNewImages((prev) => [...prev, ...result.assets]);
      setActiveSection("photos");
    }
  };

  const markExistingImageForRemoval = (image: ImagenLote) => {
    setRemovedImages((prev) => [...prev, image]);
  };

  const restoreRemovedImage = (image: ImagenLote) => {
    setRemovedImages((prev) =>
      prev.filter((img) => img.id_imagen !== image.id_imagen),
    );
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async () => {
    if (!lote || saving) return;

    if (!form.titulo.trim() || !form.precio || !form.cantidad) {
      Alert.alert("Completa los campos obligatorios");
      setActiveSection("details");
      return;
    }

    if (categorias.length === 0) {
      Alert.alert("Selecciona al menos una categoria");
      setActiveSection("categories");
      return;
    }

    if (visibleImageCount === 0) {
      Alert.alert("El lote debe tener al menos una imagen");
      setActiveSection("photos");
      return;
    }

    try {
      setSaving(true);

      await updateLote(lote.id_lote, {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        precio: Number(form.precio),
        cantidad: Number(form.cantidad),
        categoriasIds: categorias,
      });

      await Promise.all(
        removedImages
          .filter((img) => img.id_imagen > 0)
          .map((img) => deleteLoteImage(img.id_imagen)),
      );

      if (newImages.length > 0) {
        await uploadLoteImages(lote.id_lote, newImages);
      }

      navigation.navigate("Home", {
        screen: "LoteDetail",
        params: { id: lote.id_lote },
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Error al actualizar lote");
    } finally {
      setSaving(false);
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
            style={styles.iconButton}
          >
            <ArrowLeft size={20} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.screenTitle}>Editar lote</Text>
            <Text style={styles.headerSubtitle}>
              Actualiza solo lo necesario
            </Text>
          </View>

          <View style={styles.iconButtonPlaceholder} />
        </View>

        <Card contentStyle={styles.summaryCard}>
          <View style={styles.summaryImageWrap}>
            {coverImage ? (
              <Image source={{ uri: coverImage }} style={styles.summaryImage} />
            ) : (
              <View style={styles.emptyCover}>
                <ImagePlus size={28} color={colors.subtext} />
              </View>
            )}
            <View style={styles.imageBadge}>
              <Camera size={13} color={colors.white} />
              <Text style={styles.imageBadgeText}>{visibleImageCount}</Text>
            </View>
          </View>

          <View style={styles.summaryInfo}>
            <Text style={styles.summaryTitle} numberOfLines={2}>
              {form.titulo || "Lote sin titulo"}
            </Text>
            <View style={styles.summaryMetaRow}>
              <Text style={styles.priceText}>{form.precio || "0"} EUR</Text>
              <Text style={styles.stockText}>{form.cantidad || "0"} uds.</Text>
            </View>
            <View style={styles.statusPill}>
              <PackageCheck size={14} color={colors.accent} />
              <Text style={styles.statusPillText}>
                {changesCount > 0 ? `${changesCount} cambios` : "Sin cambios"}
              </Text>
            </View>
          </View>
        </Card>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {sectionTabs.map(({ key, label, Icon }) => {
            const active = activeSection === key;

            return (
              <TouchableOpacity
                key={key}
                activeOpacity={0.85}
                onPress={() => setActiveSection(key)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Icon
                  size={17}
                  color={active ? colors.primary : colors.subtext}
                  strokeWidth={2}
                />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {activeSection === "photos" && (
          <Card contentStyle={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Galeria editable</Text>
                <Text style={styles.sectionSubtitle}>
                  La primera imagen visible sera la portada.
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.addSmallButton}
                onPress={pickImages}
              >
                <Plus size={18} color={colors.white} />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryRow}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.addPhotoTile}
                onPress={pickImages}
              >
                <ImagePlus size={28} color={colors.primary} />
                <Text style={styles.addPhotoText}>Anadir</Text>
              </TouchableOpacity>

              {visibleExistingImages.map((img, index) => (
                <View key={img.id_imagen} style={styles.photoTile}>
                  <Image
                    source={{ uri: getImageUrl(img.url) }}
                    style={styles.photo}
                  />
                  {index === 0 && (
                    <View style={styles.coverPill}>
                      <Text style={styles.coverPillText}>Portada</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.photoAction}
                    onPress={() => markExistingImageForRemoval(img)}
                  >
                    <Trash2 size={15} color={colors.white} />
                  </TouchableOpacity>
                </View>
              ))}

              {newImages.map((img, index) => (
                <View key={`${img.uri}-${index}`} style={styles.photoTile}>
                  <Image source={{ uri: img.uri }} style={styles.photo} />
                  <View style={styles.newPill}>
                    <Text style={styles.newPillText}>Nueva</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.photoAction}
                    onPress={() => removeNewImage(index)}
                  >
                    <X size={15} color={colors.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            {removedImages.length > 0 && (
              <View style={styles.removedBox}>
                <Text style={styles.removedTitle}>
                  Imagenes marcadas para eliminar
                </Text>
                <View style={styles.removedRow}>
                  {removedImages.map((img) => (
                    <TouchableOpacity
                      key={img.id_imagen}
                      activeOpacity={0.85}
                      style={styles.removedImageWrap}
                      onPress={() => restoreRemovedImage(img)}
                    >
                      <Image
                        source={{ uri: getImageUrl(img.url) }}
                        style={styles.removedImage}
                      />
                      <Text style={styles.restoreText}>Restaurar</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </Card>
        )}

        {activeSection === "details" && (
          <Card contentStyle={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Informacion del lote</Text>
                <Text style={styles.sectionSubtitle}>
                  Datos visibles en busqueda y detalle.
                </Text>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Titulo</Text>
              <TextInput
                value={form.titulo}
                onChangeText={(text) => handleChange("titulo", text)}
                style={componentStyles.input}
                placeholder="Titulo del lote"
                placeholderTextColor={colors.subtext}
              />

              <Text style={styles.label}>Descripcion</Text>
              <TextInput
                value={form.descripcion}
                onChangeText={(text) => handleChange("descripcion", text)}
                style={[componentStyles.input, styles.multilineInput]}
                placeholder="Describe el contenido del lote"
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
                  <Text style={styles.label}>Stock</Text>
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
            </View>
          </Card>
        )}

        {activeSection === "categories" && (
          <Card contentStyle={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Categorias</Text>
                <Text style={styles.sectionSubtitle}>
                  Mejora donde aparece tu lote.
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.editCategoryButton}
                onPress={() => setCategoryModalVisible(true)}
              >
                <Tag size={16} color={colors.primary} />
                <Text style={styles.editCategoryText}>Editar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.selectedCategoriesWrap}>
              {selectedCategoriesData.length > 0 ? (
                selectedCategoriesData.map((cat) => {
                  const Icon = getCategoryIcon(cat.icono);

                  return (
                    <View
                      key={cat.id_categoria}
                      style={styles.selectedCategory}
                    >
                      <Icon size={16} color={colors.primary} strokeWidth={2} />
                      <Text style={styles.selectedCategoryText}>
                        {cat.nombre}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>
                  Sin categorias seleccionadas
                </Text>
              )}
            </View>
          </Card>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.ctaHelper}>
          {changesCount > 0
            ? `${changesCount} cambios pendientes`
            : "No hay cambios pendientes"}
        </Text>
        <Button
          title={saving ? "Guardando..." : "Guardar cambios"}
          onPress={handleSubmit}
          disabled={saving}
          style={styles.ctaButton}
        />
      </View>

      <Modal
        visible={categoryModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalScreen}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.iconButton}
              onPress={() => {
                if (categoriaActiva) {
                  setCategoriaActiva(null);
                } else {
                  setCategoryModalVisible(false);
                }
              }}
            >
              {categoriaActiva ? (
                <ArrowLeft size={20} color={colors.text} />
              ) : (
                <X size={20} color={colors.text} />
              )}
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.screenTitle}>
                {categoriaActiva ? "Subcategorias" : "Categorias"}
              </Text>
              <Text style={styles.headerSubtitle}>
                {categorias.length} seleccionadas
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.doneButton}
              onPress={() => setCategoryModalVisible(false)}
            >
              <Check size={20} color={colors.white} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.categoriesGrid}>
              {!categoriaActiva &&
                [...categoriasDisponibles]
                  .sort((a, b) => {
                    if (a.nombre === "Otros") return 1;
                    if (b.nombre === "Otros") return -1;
                    return 0;
                  })
                  .map((categoriaPadre) => {
                    const hasSubcategorias =
                      categoriaPadre.subcategorias &&
                      categoriaPadre.subcategorias.length > 0;
                    const selected = categorias.includes(
                      categoriaPadre.id_categoria,
                    );
                    const Icon = getCategoryIcon(categoriaPadre.icono);

                    return (
                      <TouchableOpacity
                        key={categoriaPadre.id_categoria}
                        activeOpacity={0.9}
                        style={[
                          styles.categoryCard,
                          selected && styles.categoryCardSelected,
                        ]}
                        onPress={() => {
                          if (hasSubcategorias) {
                            setCategoriaActiva(categoriaPadre);
                          } else {
                            toggleCategoria(categoriaPadre.id_categoria);
                          }
                        }}
                      >
                        <Icon
                          size={28}
                          color={selected ? colors.primary : colors.text}
                          strokeWidth={1.8}
                        />
                        <Text
                          style={[
                            styles.categoryCardText,
                            selected && styles.categoryCardTextSelected,
                          ]}
                        >
                          {categoriaPadre.nombre}
                        </Text>
                        {hasSubcategorias && (
                          <ChevronRight size={18} color={colors.subtext} />
                        )}
                      </TouchableOpacity>
                    );
                  })}

              {categoriaActiva?.subcategorias?.map((subcategoria) => {
                const selected = categorias.includes(subcategoria.id_categoria);
                const Icon = getCategoryIcon(subcategoria.icono);

                return (
                  <TouchableOpacity
                    key={subcategoria.id_categoria}
                    activeOpacity={0.9}
                    style={[
                      styles.categoryCard,
                      selected && styles.categoryCardSelected,
                    ]}
                    onPress={() => toggleCategoria(subcategoria.id_categoria)}
                  >
                    <Icon
                      size={28}
                      color={selected ? colors.primary : colors.text}
                      strokeWidth={1.8}
                    />
                    <Text
                      style={[
                        styles.categoryCardText,
                        selected && styles.categoryCardTextSelected,
                      ]}
                    >
                      {subcategoria.nombre}
                    </Text>
                    {selected && <Check size={18} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </Modal>
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
    paddingBottom: 150,
    gap: spacing.lg,
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  screenTitle: {
    ...typography.heading,
    color: colors.text,
    textAlign: "center",
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.subtext,
    textAlign: "center",
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconButtonPlaceholder: {
    width: 42,
    height: 42,
  },
  summaryCard: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  summaryImageWrap: {
    width: 104,
    height: 104,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  summaryImage: {
    width: "100%",
    height: "100%",
  },
  emptyCover: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  imageBadge: {
    position: "absolute",
    left: spacing.xs,
    bottom: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    backgroundColor: "rgba(17, 24, 39, 0.78)",
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: radii.full,
  },
  imageBadgeText: {
    ...typography.caption,
    color: colors.white,
  },
  summaryInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  summaryTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  summaryMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  priceText: {
    ...typography.heading,
    color: colors.text,
  },
  stockText: {
    ...typography.caption,
    color: colors.subtext,
  },
  statusPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    backgroundColor: colors.accentSoft,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusPillText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: "700",
  },
  tabs: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  tabActive: {
    borderColor: colors.primary,
    backgroundColor: "#EFF6FF",
  },
  tabText: {
    ...typography.bodyStrong,
    color: colors.subtext,
  },
  tabTextActive: {
    color: colors.primary,
  },
  sectionContent: {
    gap: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.subtext,
    marginTop: 2,
  },
  addSmallButton: {
    width: 42,
    height: 42,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  galleryRow: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  addPhotoTile: {
    width: 112,
    height: 132,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  addPhotoText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
  },
  photoTile: {
    width: 112,
    height: 132,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  coverPill: {
    position: "absolute",
    left: spacing.xs,
    bottom: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  coverPillText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: "700",
  },
  newPill: {
    position: "absolute",
    left: spacing.xs,
    bottom: spacing.xs,
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  newPillText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: "700",
  },
  photoAction: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    width: 30,
    height: 30,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(17, 24, 39, 0.78)",
  },
  removedBox: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  removedTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  removedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  removedImageWrap: {
    width: 76,
    gap: spacing.xs,
    alignItems: "center",
  },
  removedImage: {
    width: 76,
    height: 76,
    borderRadius: radii.md,
    opacity: 0.45,
  },
  restoreText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
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
  editCategoryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  editCategoryText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
  },
  selectedCategoriesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  selectedCategory: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "#EFF6FF",
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectedCategoryText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
  },
  emptyText: {
    ...typography.body,
    color: colors.subtext,
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
  modalScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  doneButton: {
    width: 42,
    height: 42,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  modalContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  categoryCard: {
    width: "47%",
    minHeight: 132,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  categoryCardSelected: {
    borderColor: colors.primary,
    backgroundColor: "#EFF6FF",
  },
  categoryCardText: {
    ...typography.bodyStrong,
    color: colors.text,
    textAlign: "center",
  },
  categoryCardTextSelected: {
    color: colors.primary,
  },
  feedbackTitle: {
    ...typography.heading,
    color: colors.text,
    textAlign: "center",
    marginTop: spacing.md,
  },
});
