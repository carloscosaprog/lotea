import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../config/api";
import { normalizeLote } from "./lotesService";

const FAVORITOS_URL = `${API_URL}/favoritos`;

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await AsyncStorage.getItem("token");

  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const addFavorito = async (id_lote: number) => {
  const headers = await getAuthHeaders();

  const res = await fetch(FAVORITOS_URL, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id_lote }),
  });

  if (!res.ok) {
    throw new Error("Error al agregar favorito");
  }

  return await res.json();
};

export const removeFavorito = async (id_lote: number) => {
  const headers = await getAuthHeaders();

  const res = await fetch(`${FAVORITOS_URL}/${id_lote}`, {
    method: "DELETE",
    headers,
  });

  if (!res.ok) {
    throw new Error("Error al eliminar favorito");
  }

  return await res.json();
};

export const toggleFavorito = async (id_lote: number, isFavorito = false) => {
  if (isFavorito) {
    await removeFavorito(id_lote);
    return { favorito: false };
  }

  await addFavorito(id_lote);
  return { favorito: true };
};

export const checkFavorito = async (id_lote: number) => {
  const favoritos = await getFavoritos();

  return {
    favorito: favoritos.some((lote: any) => lote.id_lote === id_lote),
  };
};

export const getFavoritos = async () => {
  const headers = await getAuthHeaders();

  const res = await fetch(FAVORITOS_URL, {
    headers,
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();

  return Array.isArray(data) ? data.map(normalizeLote) : [];
};
