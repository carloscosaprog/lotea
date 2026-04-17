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
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { getLoteById, updateLote } from "../../services/lotesService";
import { getCategorias } from "../../services/categoriasService";
import ImageUploader from "../../components/lotes/ImageUploader";
import type { Lote } from "../../types/Lote";

interface Categoria {
  id_categoria: number;
  nombre: string;
}

const BASE_URL = "http://192.168.0.65:3000";

export default function EditLoteScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id } = route.params;

  const [lote, setLote] = useState<Lote | null>(null);

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    precio: "",
    cantidad: "",
    id_categoria: "",
  });

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<any[]>([]);

  const fixUrl = (url: string) =>
    url.replace("http://localhost:3000", BASE_URL);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const data = await getLoteById(Number(id));
        const cats = await getCategorias();

        if (data) {
          setLote(data);

          setForm({
            titulo: data.titulo,
            descripcion: data.descripcion,
            precio: String(data.precio),
            cantidad: String(data.cantidad),
            id_categoria: String(data.id_categoria),
          });

          setExistingImages(
            data.imagenes ? data.imagenes.map((img: any) => img.url) : [],
          );
        }

        setCategorias(cats);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (name: string, value: string) => {
    setForm({
      ...form,
      [name]: value,
    });
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!lote) return;

    if (existingImages.length === 0 && newImages.length === 0) {
      Alert.alert("Debes añadir al menos una imagen");
      return;
    }

    try {
      await updateLote(
        lote.id_lote,
        {
          titulo: form.titulo,
          descripcion: form.descripcion,
          precio: Number(form.precio),
          cantidad: Number(form.cantidad),
          id_categoria: Number(form.id_categoria),
          imagenes: existingImages.map((img) =>
            img.replace("http://localhost:3000", "http://192.168.0.65:3000"),
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

  if (!lote) {
    return (
      <View style={styles.center}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Editar lote</Text>

      <TextInput
        value={form.titulo}
        onChangeText={(text) => handleChange("titulo", text)}
        style={styles.input}
        placeholder="Título"
      />

      <TextInput
        value={form.descripcion}
        onChangeText={(text) => handleChange("descripcion", text)}
        style={styles.input}
        placeholder="Descripción"
      />

      <TextInput
        value={form.precio}
        onChangeText={(text) => handleChange("precio", text)}
        style={styles.input}
        placeholder="Precio"
        keyboardType="numeric"
      />

      <TextInput
        value={form.cantidad}
        onChangeText={(text) => handleChange("cantidad", text)}
        style={styles.input}
        placeholder="Cantidad"
        keyboardType="numeric"
      />

      <Text style={{ marginTop: 10 }}>Categoría:</Text>

      {categorias.map((cat) => (
        <TouchableOpacity
          key={cat.id_categoria}
          style={[
            styles.categoryItem,
            form.id_categoria === String(cat.id_categoria) &&
              styles.categorySelected,
          ]}
          onPress={() => handleChange("id_categoria", String(cat.id_categoria))}
        >
          <Text>{cat.nombre}</Text>
        </TouchableOpacity>
      ))}

      <View style={{ marginTop: 15 }}>
        <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
          Imágenes actuales
        </Text>

        <View style={styles.imageRow}>
          {existingImages.map((img, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri: fixUrl(img) }} style={styles.image} />

              <TouchableOpacity
                onPress={() => removeExistingImage(index)}
                style={styles.removeBtn}
              >
                <Text style={styles.removeText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 15 }}>
        <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
          Añadir imágenes
        </Text>
        <ImageUploader onChange={setNewImages} />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Guardar cambios</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },

  categoryItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    marginTop: 5,
  },

  categorySelected: {
    backgroundColor: "#dbeafe",
    borderColor: "#2563eb",
  },

  imageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  imageContainer: {
    position: "relative",
  },

  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },

  removeBtn: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "red",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  removeText: {
    color: "#fff",
    fontSize: 12,
  },

  button: {
    marginTop: 20,
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
