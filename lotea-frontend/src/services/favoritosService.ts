import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../config/api";

const FAVORITOS_URL = `${API_URL}/favoritos`;

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const toggleFavorito = async (id_lote: number) => {
  const headers = await getAuthHeaders();

  const res = await fetch(`${FAVORITOS_URL}/${id_lote}`, {
    method: "POST",
    headers,
  });

  return await res.json();
};

// check
export const checkFavorito = async (id_lote: number) => {
  const headers = await getAuthHeaders();

  const res = await fetch(`${FAVORITOS_URL}/check/${id_lote}`, {
    headers,
  });

  return await res.json();
};
// devuelve favortios para pasarselo a la screen de Favoritos
export const getFavoritos = async () => {
  const headers = await getAuthHeaders();

  const res = await fetch(FAVORITOS_URL, {
    headers,
  });

  return await res.json();
};
