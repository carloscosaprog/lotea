import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../config/api";

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getUserById = async (id: number) => {
  const res = await fetch(`${API_URL}/lotes/user/${id}`);

  if (!res.ok) throw new Error("Error al cargar usuario");

  return await res.json();
};

export const getProfile = async () => {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/auth/me`, {
    headers,
  });

  if (!res.ok) throw new Error("Error al cargar perfil");

  const data = await res.json();

  return data;
};

export const updateProfile = async (nombre: string) => {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/auth/me`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ nombre }),
  });

  if (!res.ok) throw new Error("Error al actualizar perfil");

  return await res.json();
};

export const uploadAvatar = async (image: any) => {
  const token = await AsyncStorage.getItem("token");

  const formData = new FormData();
  const fileName =
    image.fileName ||
    image.file_name ||
    `avatar.${image.mimeType?.split("/")[1] || "jpg"}`;
  const mimeType = image.mimeType || image.type || "image/jpeg";

  formData.append("avatar", {
    uri: image.uri,
    name: fileName,
    type: mimeType,
  } as any);

  const res = await fetch(`${API_URL}/lotes/user/avatar`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // IMPORTANTE: NO pongas Content-Type aquí
    },
    body: formData,
  });

  const text = await res.text();

  if (!res.ok) throw new Error("Error subiendo avatar");

  return JSON.parse(text);
};
