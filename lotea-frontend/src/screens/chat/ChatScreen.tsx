import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

import { useAuth } from "../../context/AuthContext";
import {
  ChatMessage,
  getMessages,
  markMessagesAsRead,
  sendMessage,
} from "../../services/chatService";
import { connectSocket, socket } from "../../services/socket";
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
  });
};

export default function ChatScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const userId = getUserId(user);
  const conversationId = Number(route.params?.conversationId);
  const title = route.params?.otherUserName || route.params?.loteTitulo || "Chat";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const data = await getMessages(conversationId);
        setMessages(data);
      } catch (error) {
        Alert.alert("Error", "No se pudieron cargar los mensajes");
      } finally {
        setLoading(false);
      }
    };

    if (conversationId) {
      loadMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    if (!userId) return;

    connectSocket(userId);

    markMessagesAsRead(conversationId, userId).catch(() => undefined);
    socket.emit("mark_as_read", { conversationId, userId });

    const handleReceiveMessage = ({ message }: { message: ChatMessage }) => {
      if (message.conversationId !== conversationId) return;

      setMessages((current) => {
        if (current.some((item) => item.id === message.id)) return current;

        return [...current, message];
      });

      if (message.senderId !== userId) {
        markMessagesAsRead(conversationId, userId).catch(() => undefined);
        socket.emit("mark_as_read", { conversationId, userId });
      }
    };

    const handleMessagesRead = (data: { conversationId: number }) => {
      if (data.conversationId !== conversationId) return;

      setMessages((current) =>
        current.map((message) =>
          message.senderId === userId ? { ...message, read: true } : message,
        ),
      );
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("messages_read", handleMessagesRead);
    };
  }, [conversationId, userId]);

  const handleSend = async () => {
    const cleanText = text.trim();

    if (!cleanText || !userId || sending) return;

    setSending(true);
    setText("");

    if (socket.connected) {
      socket.emit("send_message", {
        conversationId,
        senderId: userId,
        text: cleanText,
      });
      setSending(false);
      return;
    }

    try {
      const message = await sendMessage({
        conversationId,
        senderId: userId,
        text: cleanText,
      });
      setMessages((current) => [...current, message]);
    } catch (error) {
      setText(cleanText);
      Alert.alert("Error", "No se pudo enviar el mensaje");
    } finally {
      setSending(false);
    }
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
      keyboardVerticalOffset={80}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
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
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
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
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Sin mensajes todavia</Text>
            <Text style={styles.emptyText}>Escribe el primer mensaje.</Text>
          </View>
        }
      />

      <View style={styles.inputBar}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Escribe un mensaje..."
          placeholderTextColor={colors.subtext}
          style={styles.input}
          multiline
        />
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.sendButton, (!text.trim() || sending) && styles.sendButtonDisabled]}
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
  messageStatus: {
    flexDirection: "row",
    alignSelf: "flex-end",
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
