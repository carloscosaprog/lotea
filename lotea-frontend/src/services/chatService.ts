const BASE_URL = "http://192.168.0.65:3000/chat";

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
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  text: string;
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
  const response = await fetch(`${BASE_URL}/conversations/${userId}`);

  return getJson<Conversation[]>(response);
};

export const getMessages = async (
  conversationId: number,
): Promise<ChatMessage[]> => {
  const response = await fetch(`${BASE_URL}/messages/${conversationId}`);

  return getJson<ChatMessage[]>(response);
};

export const sendMessage = async (
  data: SendMessageData,
): Promise<ChatMessage> => {
  const response = await fetch(`${BASE_URL}/messages`, {
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
  const response = await fetch(`${BASE_URL}/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return getJson<Conversation>(response);
};
