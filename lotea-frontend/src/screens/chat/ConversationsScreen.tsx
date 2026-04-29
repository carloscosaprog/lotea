import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { useAuth } from "../../context/AuthContext";
import {
  Conversation,
  getConversations,
} from "../../services/chatService";
import { colors } from "../../styles/colors";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";
import { layoutStyles } from "../../styles/theme";

const API_URL = "http://192.168.0.65:3000";

const getUserId = (user: unknown) => {
  const currentUser = user as { id?: number; id_usuario?: number } | null;

  return currentUser?.id ?? currentUser?.id_usuario ?? null;
};

const fixUrl = (url?: string | null) => {
  if (!url) return "https://picsum.photos/120";

  return url.replace("http://localhost:3000", API_URL);
};

export default function ConversationsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const userId = getUserId(user);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const data = await getConversations(userId);
      setConversations(data);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar las conversaciones");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadConversations();
    }, [loadConversations]),
  );

  if (loading) {
    return (
      <View style={layoutStyles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.feedbackText}>Cargando conversaciones...</Text>
      </View>
    );
  }

  return (
    <View style={layoutStyles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis conversaciones</Text>
        <View style={{ width: 22 }} />
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.row}
            onPress={() =>
              navigation.navigate("Chat", {
                conversationId: item.id,
                loteTitulo: item.loteTitulo,
                otherUserName: item.otherUserName,
              })
            }
          >
            <Image source={{ uri: fixUrl(item.loteImagen) }} style={styles.image} />
            <View style={styles.copy}>
              <Text numberOfLines={1} style={styles.title}>
                {item.otherUserName || "Conversacion"}
              </Text>
              <Text numberOfLines={1} style={styles.loteTitle}>
                {item.loteTitulo || "Lote"}
              </Text>
              <Text numberOfLines={1} style={styles.lastMessage}>
                {item.lastMessage || "Sin mensajes todavia"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.subtext} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No tienes conversaciones</Text>
            <Text style={styles.emptyText}>
              Contacta con un vendedor desde el detalle de un lote.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.heading,
    color: colors.text,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  row: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: radii.md,
    backgroundColor: "#E5E7EB",
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  loteTitle: {
    ...typography.caption,
    color: colors.primary,
  },
  lastMessage: {
    ...typography.caption,
    color: colors.subtext,
  },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...typography.heading,
    color: colors.text,
    textAlign: "center",
  },
  emptyText: {
    ...typography.body,
    color: colors.subtext,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  feedbackText: {
    ...typography.body,
    color: colors.subtext,
    marginTop: spacing.sm,
  },
});
