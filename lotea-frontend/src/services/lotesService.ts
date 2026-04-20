import type { Lote, LoteCreate } from "../types/Lote";

const BASE_URL = "http://10.0.2.2:3000/lotes";

// helper para token
const getAuthHeaders = async () => {
  const AsyncStorage =
    require("@react-native-async-storage/async-storage").default;
  const token = await AsyncStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
  };
};

// helper para construir archivos correctamente
const buildImageFile = (file: any, index: number) => {
  const uri = file?.uri || file?.assets?.[0]?.uri;

  if (!uri) return null;

  const filename = uri.split("/").pop() || `image_${index}.jpg`;
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : "image/jpeg";

  return {
    uri,
    name: filename,
    type,
  };
};

// Obtener todos los lotes
export const getLotes = async (): Promise<Lote[]> => {
  const response = await fetch(BASE_URL);

  if (!response.ok) {
    throw new Error("Error al obtener lotes");
  }

  return await response.json();
};

// Obtener lote por ID
export const getLoteById = async (id: number): Promise<Lote | undefined> => {
  const response = await fetch(`${BASE_URL}/${id}`);

  if (!response.ok) return undefined;

  return await response.json();
};

// Crear lote
export const createLote = async (
  lote: LoteCreate,
  files: any[],
): Promise<Lote> => {
  const formData = new FormData();

  formData.append("titulo", lote.titulo);
  formData.append("descripcion", lote.descripcion);
  formData.append("precio", String(lote.precio));
  formData.append("cantidad", String(lote.cantidad));
  formData.append("id_categoria", String(lote.id_categoria));

  if (files && files.length > 0) {
    files.forEach((file, index) => {
      const image = buildImageFile(file, index);
      if (!image) return;

      formData.append("imagenesFiles", image as any);
    });
  }

  const headers = await getAuthHeaders();

  const response = await fetch(BASE_URL, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    console.log("ERROR BACKEND:", text);
    throw new Error("Error al crear lote");
  }

  return await response.json();
};

// Actualizar lote
export const updateLote = async (id: number, lote: any, files: any[]) => {
  const formData = new FormData();

  formData.append("titulo", lote.titulo);
  formData.append("descripcion", lote.descripcion);
  formData.append("precio", String(lote.precio));
  formData.append("cantidad", String(lote.cantidad));
  formData.append("id_categoria", String(lote.id_categoria));

  // imágenes existentes
  if (lote.imagenes && lote.imagenes.length > 0) {
    formData.append("imagenes", JSON.stringify(lote.imagenes));
  }

  // nuevas imágenes
  if (files && files.length > 0) {
    files.forEach((file, index) => {
      const image = buildImageFile(file, index);
      if (!image) return;

      formData.append("imagenesFiles", image as any);
    });
  }

  const headers = await getAuthHeaders();

  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    console.log("ERROR BACKEND:", text);
    throw new Error("Error al actualizar lote");
  }

  return await response.json();
};

// Eliminar lote
export const deleteLote = async (id: number): Promise<boolean> => {
  const headers = await getAuthHeaders();

  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
    headers,
  });

  return response.ok;
};

// Obtener lotes por usuario
export const getLotesByUser = async (id: number) => {
  const res = await fetch(`${BASE_URL}/usuario/${id}`);

  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Respuesta no válida del backend");
  }
};

// Obtener mis lotes
export const getMisLotes = async () => {
  const AsyncStorage =
    require("@react-native-async-storage/async-storage").default;

  const userString = await AsyncStorage.getItem("user");

  if (!userString) {
    return [];
  }

  const user = JSON.parse(userString);

  if (!user?.id_usuario) {
    return [];
  }

  const res = await fetch(`${BASE_URL}/usuario/${user.id_usuario}`);

  if (!res.ok) {
    return [];
  }

  return await res.json();
};
