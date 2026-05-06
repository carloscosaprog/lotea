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
  id_lote: number;
  contenido: string;
  fecha: string;
  leido: boolean;
  emisor?: BackendUser;
  receptor?: BackendUser;
};

type BackendConversation = {
  id: string;
  id_lote: number;
  otherUserId: number;
  otherUserName?: string;
  otherUserAvatar?: string | null;
  loteTitulo?: string;
  loteImagen?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
};

export interface Conversation {
  id: string;
  loteId: number;
  otherUserId: number;
  otherUserName?: string;
  otherUserAvatar?: string | null;
  loteTitulo?: string;
  loteImagen?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
}

export interface ChatMessage {
  id: number;
  loteId: number;
  senderId: number;
  receiverId: number;
  text: string;
  read: boolean;
  createdAt: string;
}

interface SendMessageData {
  receiverId: number;
  loteId: number;
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
    throw new Error(`${response.status}: ${text || "Error en mensajes"}`);
  }

  return response.json();
};

const normalizeMessage = (mensaje: BackendMensaje): ChatMessage => ({
  id: mensaje.id_mensaje,
  loteId: mensaje.id_lote,
  senderId: mensaje.id_emisor,
  receiverId: mensaje.id_receptor,
  text: mensaje.contenido,
  read: mensaje.leido,
  createdAt: mensaje.fecha,
});

export const getConversations = async (): Promise<Conversation[]> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${MENSAJES_URL}/conversaciones`, {
    headers,
  });
  const data = await getJson<BackendConversation[]>(response);

  return data.map((conversation) => ({
    id: conversation.id,
    loteId: conversation.id_lote,
    otherUserId: conversation.otherUserId,
    otherUserName: conversation.otherUserName,
    otherUserAvatar: conversation.otherUserAvatar ?? null,
    loteTitulo: conversation.loteTitulo,
    loteImagen: conversation.loteImagen ?? null,
    lastMessage: conversation.lastMessage,
    lastMessageAt: conversation.lastMessageAt,
    unreadCount: conversation.unreadCount ?? 0,
  }));
};

export const getMessages = async (
  loteId: number,
  otherUserId: number,
): Promise<ChatMessage[]> => {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${MENSAJES_URL}/conversacion/${loteId}/${otherUserId}`,
    { headers },
  );
  const data = await getJson<BackendMensaje[]>(response);

  return data.map(normalizeMessage);
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
      id_lote: data.loteId,
      contenido: data.text,
    }),
  });
  const mensaje = await getJson<BackendMensaje>(response);

  return normalizeMessage(mensaje);
};

export const markConversationAsRead = async (
  loteId: number,
  otherUserId: number,
) => {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${MENSAJES_URL}/conversacion/${loteId}/${otherUserId}/leido`,
    {
      method: "PATCH",
      headers,
    },
  );

  return getJson<{ ok: boolean }>(response);
};

export const deleteConversation = async (
  loteId: number,
  otherUserId: number,
) => {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${MENSAJES_URL}/conversacion/${loteId}/${otherUserId}`,
    {
      method: "DELETE",
      headers,
    },
  );

  return getJson<{ ok: boolean }>(response);
};
