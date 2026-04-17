import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getMisLotes, deleteLote } from "../../services/lotesService";
import type { Lote } from "../../types/Lote";

export default function MisLotesScreen() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation<any>();

  const fetchLotes = async () => {
    try {
      const data = await getMisLotes();
      setLotes(data);
    } catch (error) {
      console.error("Error al cargar tus lotes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLotes();
  }, []);

  const handleDelete = async (id: number) => {
    Alert.alert("Eliminar lote", "¿Eliminar lote?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteLote(id);
            setLotes(lotes.filter((l) => l.id_lote !== id));
          } catch (error) {
            console.error(error);
            Alert.alert("Error al eliminar lote");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis lotes</Text>

      {lotes.length === 0 ? (
        <Text>No has creado ningún lote todavía</Text>
      ) : (
        <FlatList
          data={lotes}
          keyExtractor={(item) => item.id_lote.toString()}
          contentContainerStyle={{ gap: 10 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.info}
                onPress={() =>
                  navigation.navigate("Home", {
                    screen: "LoteDetail",
                    params: { id: item.id_lote },
                  })
                }
              >
                <Image
                  source={{
                    uri: item.imagen || "https://picsum.photos/100",
                  }}
                  style={styles.image}
                />

                <View>
                  <Text style={styles.titleItem}>{item.titulo}</Text>
                  <Text style={styles.subtitle}>{item.cantidad} unidades</Text>
                  <Text style={styles.price}>{item.precio} €</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("Perfil", {
                      screen: "EditLote",
                      params: { id: item.id_lote },
                    })
                  }
                  style={styles.editBtn}
                >
                  <Text style={styles.btnText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDelete(item.id_lote)}
                  style={styles.deleteBtn}
                >
                  <Text style={styles.btnText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
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

  card: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  info: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },

  image: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },

  titleItem: {
    fontWeight: "bold",
  },

  subtitle: {
    color: "#666",
    fontSize: 12,
  },

  price: {
    fontWeight: "bold",
  },

  actions: {
    gap: 5,
  },

  editBtn: {
    backgroundColor: "orange",
    padding: 6,
    borderRadius: 6,
    alignItems: "center",
  },

  deleteBtn: {
    backgroundColor: "red",
    padding: 6,
    borderRadius: 6,
    alignItems: "center",
  },

  btnText: {
    color: "#fff",
    fontSize: 12,
  },
});
