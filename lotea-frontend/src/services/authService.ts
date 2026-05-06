import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../config/api";

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await AsyncStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const getStoredUserId = async () => {
  const userString = await AsyncStorage.getItem("user");

  if (!userString) return null;

  const user = JSON.parse(userString);

  return user?.id_usuario ?? user?.id ?? null;
};

export const getUserById = async (id: number) => {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/usuarios/${id}`, {
    headers,
  });

  if (!res.ok) throw new Error("Error al cargar usuario");

  return await res.json();
};

export const getProfile = async () => {
  const userId = await getStoredUserId();

  if (!userId) {
    throw new Error("No hay usuario guardado");
  }

  return getUserById(Number(userId));
};

export const updateProfile = async (nombre: string) => {
  const userId = await getStoredUserId();

  if (!userId) {
    throw new Error("No hay usuario guardado");
  }

  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/usuarios/${userId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ nombre }),
  });

  if (!res.ok) throw new Error("Error al actualizar perfil");

  return await res.json();
};

export const uploadAvatar = async (
  image: any,
): Promise<{ avatar?: string | null }> => {
  const token = await AsyncStorage.getItem("token");
  const formData = new FormData();
  const fileName =
    image.fileName ||
    image.file_name ||
    image.name ||
    `avatar.${image.mimeType?.split("/")[1] || "jpg"}`;
  const mimeType = image.mimeType || image.type || "image/jpeg";

  formData.append("avatar", {
    uri: image.uri,
    name: fileName,
    type: mimeType,
  } as any);

  const res = await fetch(`${API_URL}/usuarios/avatar`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!res.ok) throw new Error("Error subiendo avatar");

  return await res.json();
};

export const removeAvatar = async (): Promise<{ avatar?: string | null }> => {
  const token = await AsyncStorage.getItem("token");

  const res = await fetch(`${API_URL}/usuarios/avatar`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!res.ok) throw new Error("Error eliminando avatar");

  return await res.json();
};
