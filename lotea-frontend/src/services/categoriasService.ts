const API_URL = "http://192.168.0.65:3000/categorias";

export const getCategorias = async () => {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Error al obtener categorías");
  }

  return await response.json();
};
