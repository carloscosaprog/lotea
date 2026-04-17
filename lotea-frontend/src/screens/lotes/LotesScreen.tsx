import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
} from "react-native";
import { getLotes } from "../../services/lotesService";
import type { Lote } from "../../types/Lote";
import LoteCard from "../../components/lotes/LoteCard";

export default function LotesScreen() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLotes = async () => {
      try {
        const data = await getLotes();
        setLotes(data);
      } catch (error) {
        console.error("Error al cargar lotes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLotes();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Cargando lotes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Todos los lotes</Text>

      {lotes.length === 0 ? (
        <Text style={styles.emptyText}>No hay lotes disponibles</Text>
      ) : (
        <FlatList
          data={lotes}
          keyExtractor={(item) => item.id_lote.toString()}
          numColumns={2}
          columnWrapperStyle={{ gap: 10 }}
          contentContainerStyle={{ gap: 10 }}
          renderItem={({ item }) => <LoteCard lote={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  emptyText: {
    color: "#666",
  },
});
