import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  KeyboardEvent,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../../context/AuthContext";
import {
  ChatMessage,
  deleteConversation,
  getMessages,
  markConversationAsRead,
  sendMessage,
} from "../../services/chatService";
import { colors } from "../../styles/colors";
import { radii, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";
import { layoutStyles } from "../../styles/theme";

const getUserId = (user: unknown) => {
  const currentUser = user as { id?: number; id_usuario?: number } | null;

  return currentUser?.id ?? currentUser?.id_usuario ?? null;
};

const formatTime = (value?: string) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  });
};

export default function ChatScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const userId = getUserId(user);
  const otherUserIdParam =
    route.params?.otherUserId ??
    route.params?.sellerId ??
    route.params?.id_receptor ??
    route.params?.receiverId ??
    route.params?.conversationId;
  const loteIdParam = route.params?.loteId ?? route.params?.id_lote;
  const initialLoteId =
    loteIdParam && Number.isFinite(Number(loteIdParam))
      ? Number(loteIdParam)
      : null;
  const initialOtherUserId =
    otherUserIdParam && Number.isFinite(Number(otherUserIdParam))
      ? Number(otherUserIdParam)
      : null;
  const title =
    route.params?.otherUserName || route.params?.loteTitulo || "Chat";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loteId] = useState<number | null>(initialLoteId);
  const [otherUserId] = useState<number | null>(initialOtherUserId);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const isKeyboardOpen = keyboardHeight > 0;

  const inputBarBottomPadding =
    Platform.OS === "android" && isKeyboardOpen
      ? spacing.lg
      : Math.max(insets.bottom, spacing.lg);
  const inputBarBottomOffset =
    Platform.OS === "android" && isKeyboardOpen
      ? Math.max(keyboardHeight - tabBarHeight - insets.bottom, 0) + spacing.sm
      : 0;
  const listBottomPadding =
    Platform.OS === "android" && isKeyboardOpen
      ? keyboardHeight + spacing.xxxl
      : spacing.lg;

  useEffect(() => {
    if (!loteId || !otherUserId) {
      setLoading(false);
      return;
    }

    const loadMessages = async (showError = true) => {
      try {
        const data = await getMessages(loteId, otherUserId);

        setMessages((current) => {
          if (JSON.stringify(current) === JSON.stringify(data)) {
            return current;
          }

          return data;
        });

        await markConversationAsRead(loteId, otherUserId);
      } catch (error) {
        console.error("Error cargando mensajes:", error);

        if (showError) {
          Alert.alert("Error", "No se pudieron cargar los mensajes");
        }
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    const interval = setInterval(() => {
      loadMessages(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [loteId, otherUserId]);

  useEffect(() => {
    const handleKeyboardShow = (event: KeyboardEvent) => {
      setKeyboardHeight(event.endCoordinates.height);
      listRef.current?.scrollToEnd({ animated: true });
    };

    const showSubscription = Keyboard.addListener(
      "keyboardDidShow",
      handleKeyboardShow,
    );
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleSend = async () => {
    const cleanText = text.trim();

    if (!cleanText || !userId || !loteId || !otherUserId || sending) return;

    setSending(true);
    setText("");

    try {
      const message = await sendMessage({
        receiverId: otherUserId,
        loteId,
        text: cleanText,
      });
      setMessages((current) => [...current, message]);
    } catch (error) {
      console.error("Error enviando mensaje:", error);
      setText(cleanText);
      Alert.alert("Error", "No se pudo enviar el mensaje");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteConversation = () => {
    setMenuOpen(false);

    Alert.alert(
      "Eliminar conversacion",
      "Se eliminara esta conversacion y sus mensajes.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              if (loteId && otherUserId) {
                await deleteConversation(loteId, otherUserId);
              }

              navigation.goBack();
            } catch {
              Alert.alert("Error", "No se pudo eliminar la conversacion");
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={layoutStyles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.feedbackText}>Cargando conversacion...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={layoutStyles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text numberOfLines={1} style={styles.headerTitle}>
            {title}
          </Text>
          {route.params?.loteTitulo && (
            <Text numberOfLines={1} style={styles.headerSubtitle}>
              {route.params.loteTitulo}
            </Text>
          )}
        </View>
        <View style={styles.menuWrap}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.menuButton}
            onPress={() => setMenuOpen((current) => !current)}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
          </TouchableOpacity>

          {menuOpen && (
            <View style={styles.menu}>
              <TouchableOpacity activeOpacity={0.8} style={styles.menuItem}>
                <Text style={styles.menuText}>Reportar usuario</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.menuItem}
                onPress={handleDeleteConversation}
              >
                <Text style={styles.menuTextDanger}>Eliminar conversacion</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8} style={styles.menuItem}>
                <Text style={styles.menuText}>Bloquear usuario</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.messagesContent,
          { paddingBottom: listBottomPadding },
        ]}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({ animated: true })
        }
        renderItem={({ item }) => {
          const isMine = item.senderId === userId;

          return (
            <View
              style={[
                styles.messageRow,
                isMine ? styles.messageRowMine : styles.messageRowOther,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  isMine ? styles.bubbleMine : styles.bubbleOther,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isMine ? styles.messageTextMine : styles.messageTextOther,
                  ]}
                >
                  {item.text}
                </Text>
                <View style={styles.messageMeta}>
                  <Text
                    style={[
                      styles.messageTime,
                      isMine ? styles.messageTimeMine : styles.messageTimeOther,
                    ]}
                  >
                    {formatTime(item.createdAt)}
                  </Text>
                  {isMine && (
                    <View style={styles.messageStatus}>
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={styles.messageStatusIcon.color}
                      />
                      {item.read && (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={styles.messageStatusIcon.color}
                          style={styles.messageStatusSecondIcon}
                        />
                      )}
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Sin mensajes todavia</Text>
            <Text style={styles.emptyText}>Escribe el primer mensaje.</Text>
          </View>
        }
      />

      <View
        style={[
          styles.inputBar,
          {
            marginBottom: inputBarBottomOffset,
            paddingBottom: inputBarBottomPadding,
          },
        ]}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Escribe un mensaje..."
          placeholderTextColor={colors.subtext}
          style={styles.input}
          multiline
          returnKeyType="send"
          submitBehavior="submit"
          onSubmitEditing={handleSend}
          onFocus={() => listRef.current?.scrollToEnd({ animated: true })}
        />
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.sendButton,
            (!text.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          <Ionicons name="send" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
    zIndex: 20,
    elevation: 20,
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    ...typography.heading,
    color: colors.text,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.subtext,
  },
  menuWrap: {
    position: "relative",
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  menu: {
    position: "absolute",
    top: 42,
    right: 0,
    width: 210,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    zIndex: 10,
    overflow: "hidden",
  },
  menuItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuText: {
    ...typography.body,
    color: colors.text,
  },
  menuTextDanger: {
    ...typography.body,
    color: colors.danger,
  },
  messagesContent: {
    padding: spacing.lg,
    gap: spacing.sm,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: "row",
  },
  messageRowMine: {
    justifyContent: "flex-end",
  },
  messageRowOther: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xxs,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radii.sm,
  },
  bubbleOther: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: radii.sm,
  },
  messageText: {
    ...typography.body,
  },
  messageTextMine: {
    color: colors.white,
  },
  messageTextOther: {
    color: colors.text,
  },
  messageTime: {
    ...typography.caption,
    alignSelf: "flex-end",
  },
  messageTimeMine: {
    color: "#DBEAFE",
  },
  messageTimeOther: {
    color: colors.subtext,
  },
  messageMeta: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: spacing.xxs,
  },
  messageStatus: {
    flexDirection: "row",
  },
  messageStatusIcon: {
    color: "#D1D5DB",
  },
  messageStatusSecondIcon: {
    marginLeft: -4,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 110,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: typography.body.fontSize,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
  },
  emptyTitle: {
    ...typography.heading,
    color: colors.text,
  },
  emptyText: {
    ...typography.body,
    color: colors.subtext,
    marginTop: spacing.xs,
  },
  feedbackText: {
    ...typography.body,
    color: colors.subtext,
    marginTop: spacing.sm,
  },
});
