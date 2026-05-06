import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../config/api";

const MENSAJES_URL = `${API_URL}/mensajes`;

type BackendUser = {
  id_usuario: number;
  nombre: string;
  avatar?: string | null;
};

type BackendMensaje = {
  id_mensaje: number;
  id_emisor: number;
  id_receptor: number;
  contenido: string;
  fecha: string;
  emisor?: BackendUser;
  receptor?: BackendUser;
};

export interface Conversation {
  id: number;
  otherUserId: number;
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
  receiverId: number;
  text: string;
  read: boolean;
  createdAt: string;
}

interface SendMessageData {
  receiverId: number;
  text: string;
}

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await AsyncStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const getJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Error en mensajes");
  }

  return response.json();
};

const normalizeMessage = (mensaje: BackendMensaje): ChatMessage => ({
  id: mensaje.id_mensaje,
  conversationId: mensaje.id_emisor === mensaje.id_receptor ? mensaje.id_receptor : 0,
  senderId: mensaje.id_emisor,
  receiverId: mensaje.id_receptor,
  text: mensaje.contenido,
  read: false,
  createdAt: mensaje.fecha,
});

export const getConversations = async (
  userId: number,
): Promise<Conversation[]> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${MENSAJES_URL}/conversaciones`, {
    headers,
  });
  const data = await getJson<BackendMensaje[]>(response);

  return data.map((mensaje) => {
    const otherUser =
      mensaje.id_emisor === userId ? mensaje.receptor : mensaje.emisor;
    const otherUserId =
      mensaje.id_emisor === userId ? mensaje.id_receptor : mensaje.id_emisor;

    return {
      id: otherUserId,
      otherUserId,
      otherUserName: otherUser?.nombre,
      otherUserAvatar: otherUser?.avatar ?? null,
      lastMessage: mensaje.contenido,
      lastMessageAt: mensaje.fecha,
      unreadCount: 0,
    };
  });
};

export const getMessages = async (
  otherUserId: number,
): Promise<ChatMessage[]> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${MENSAJES_URL}/conversacion/${otherUserId}`, {
    headers,
  });
  const data = await getJson<BackendMensaje[]>(response);

  return data.map((mensaje) => ({
    ...normalizeMessage(mensaje),
    conversationId: otherUserId,
  }));
};

export const sendMessage = async (
  data: SendMessageData,
): Promise<ChatMessage> => {
  const headers = await getAuthHeaders();
  const response = await fetch(MENSAJES_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      id_receptor: data.receiverId,
      contenido: data.text,
    }),
  });
  const mensaje = await getJson<BackendMensaje>(response);

  return {
    ...normalizeMessage(mensaje),
    conversationId: data.receiverId,
  };
};

export const deleteConversation = async (otherUserId: number) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${MENSAJES_URL}/conversacion/${otherUserId}`, {
    method: "DELETE",
    headers,
  });

  return getJson<{ ok: boolean }>(response);
};

export const markMessagesAsRead = async () => ({ ok: true, updated: 0 });
