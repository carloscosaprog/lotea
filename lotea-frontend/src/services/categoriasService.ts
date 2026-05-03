import { API_URL } from "../config/api";

export const getCategorias = async () => {
  const response = await fetch(`${API_URL}/categorias`);

  if (!response.ok) {
    throw new Error("Error al obtener categorías");
  }

  return await response.json();
};
