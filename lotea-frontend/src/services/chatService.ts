import { API_URL } from "../config/api";

const CHAT_URL = `${API_URL}/chat`;

export interface Conversation {
  id: number;
  participants: number[];
  loteId: number;
  createdAt: string;
  loteTitulo?: string;
  loteImagen?: string | null;
  sellerId?: number;
  otherUserId?: number;
  otherUserName?: string;
  otherUserAvatar?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  text: string;
  read: boolean;
  createdAt: string;
}

interface SendMessageData {
  conversationId: number;
  senderId: number;
  text: string;
}

interface ConversationData {
  buyerId: number;
  sellerId: number;
  loteId: number;
}

const getJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error("Error en chat");
  }

  return response.json();
};

export const getConversations = async (
  userId: number,
): Promise<Conversation[]> => {
  const response = await fetch(`${CHAT_URL}/conversations/${userId}`);

  return getJson<Conversation[]>(response);
};

export const getMessages = async (
  conversationId: number,
): Promise<ChatMessage[]> => {
  const response = await fetch(`${CHAT_URL}/messages/${conversationId}`);

  return getJson<ChatMessage[]>(response);
};

export const sendMessage = async (
  data: SendMessageData,
): Promise<ChatMessage> => {
  const response = await fetch(`${CHAT_URL}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return getJson<ChatMessage>(response);
};

export const getOrCreateConversation = async (
  data: ConversationData,
): Promise<Conversation> => {
  const response = await fetch(`${CHAT_URL}/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return getJson<Conversation>(response);
};

export const deleteConversation = async (conversationId: number) => {
  const response = await fetch(`${CHAT_URL}/conversations/${conversationId}`, {
    method: "DELETE",
  });

  return getJson<{ ok: boolean }>(response);
};

export const markMessagesAsRead = async (
  conversationId: number,
  userId: number,
) => {
  const response = await fetch(`${CHAT_URL}/messages/read/${conversationId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });

  return getJson<{ ok: boolean; updated: number }>(response);
};
