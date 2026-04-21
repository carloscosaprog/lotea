import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://10.0.2.2:3000/favoritos";

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const toggleFavorito = async (id_lote: number) => {
  const headers = await getAuthHeaders();

  const res = await fetch(`${BASE_URL}/${id_lote}`, {
    method: "POST",
    headers,
  });

  return await res.json();
};

// check
export const checkFavorito = async (id_lote: number) => {
  const headers = await getAuthHeaders();

  const res = await fetch(`${BASE_URL}/check/${id_lote}`, {
    headers,
  });

  return await res.json();
};
// devuelve favortios para pasarselo a la screen de Favoritos
export const getFavoritos = async () => {
  const headers = await getAuthHeaders();

  const res = await fetch(BASE_URL, {
    headers,
  });

  return await res.json();
};
