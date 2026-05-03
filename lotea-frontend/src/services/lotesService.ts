import type { Lote, LoteCreate } from "../types/Lote";
import { API_URL } from "../config/api";

const LOTES_URL = `${API_URL}/lotes`;

// helper para token
const getAuthHeaders = async () => {
  const AsyncStorage =
    require("@react-native-async-storage/async-storage").default;
  const token = await AsyncStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
  };
};

// NORMALIZADOR CLAVE
const normalizeLote = (lote: any): Lote => {
  let imagenes: string[] = [];

  if (Array.isArray(lote.imagenes)) {
    if (lote.imagenes.length > 0) {
      if (typeof lote.imagenes[0] === "string") {
        imagenes = lote.imagenes;
      } else if (lote.imagenes[0]?.url) {
        imagenes = lote.imagenes.map((img: any) => img.url);
      }
    }
  }

  // fallback si no hay imagenes válidas
  if (imagenes.length === 0 && lote.imagen) {
    imagenes = [lote.imagen];
  }

  return {
    ...lote,
    imagenes,
    categorias: Array.isArray(lote.categorias)
      ? lote.categorias
      : lote.categoria
        ? [lote.categoria]
        : [],
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
  const response = await fetch(LOTES_URL);

  if (!response.ok) {
    throw new Error("Error al obtener lotes");
  }

  const data = await response.json();

  return data.map(normalizeLote);
};

// Obtener lote por ID
export const getLoteById = async (id: number): Promise<Lote | undefined> => {
  const response = await fetch(`${LOTES_URL}/${id}`);

  if (!response.ok) return undefined;

  const data = await response.json();

  return normalizeLote(data);
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
  if (lote.id_categoria) {
    formData.append("id_categoria", String(lote.id_categoria));
  }
  if (lote.categoria) {
    formData.append("categoria", lote.categoria);
  }
  formData.append("categorias", JSON.stringify(lote.categorias));

  if (files && files.length > 0) {
    files.forEach((file, index) => {
      const image = buildImageFile(file, index);
      if (!image) return;

      formData.append("imagenesFiles", image as any);
    });
  }

  const headers = await getAuthHeaders();

  const response = await fetch(LOTES_URL, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    console.log("ERROR BACKEND:", text);
    throw new Error("Error al crear lote");
  }

  const data = await response.json();

  return normalizeLote(data);
};

// Actualizar lote
export const updateLote = async (id: number, lote: any, files: any[]) => {
  const formData = new FormData();

  formData.append("titulo", lote.titulo);
  formData.append("descripcion", lote.descripcion);
  formData.append("precio", String(lote.precio));
  formData.append("cantidad", String(lote.cantidad));
  if (lote.id_categoria) {
    formData.append("id_categoria", String(lote.id_categoria));
  }
  if (lote.categoria) {
    formData.append("categoria", lote.categoria);
  }
  if (lote.categorias) {
    formData.append("categorias", JSON.stringify(lote.categorias));
  }

  if (lote.imagenes && lote.imagenes.length > 0) {
    formData.append("imagenes", JSON.stringify(lote.imagenes));
  }

  if (files && files.length > 0) {
    files.forEach((file, index) => {
      const image = buildImageFile(file, index);
      if (!image) return;

      formData.append("imagenesFiles", image as any);
    });
  }

  const headers = await getAuthHeaders();

  const response = await fetch(`${LOTES_URL}/${id}`, {
    method: "PUT",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    console.log("ERROR BACKEND:", text);
    throw new Error("Error al actualizar lote");
  }

  const data = await response.json();

  return normalizeLote(data);
};

// Eliminar lote
export const deleteLote = async (id: number): Promise<boolean> => {
  const headers = await getAuthHeaders();

  const response = await fetch(`${LOTES_URL}/${id}`, {
    method: "DELETE",
    headers,
  });

  return response.ok;
};

// Obtener lotes por usuario
export const getLotesByUser = async (id: number) => {
  const res = await fetch(`${LOTES_URL}/usuario/${id}`);
  const data = await res.json();

  return data.map(normalizeLote);
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

  const res = await fetch(`${LOTES_URL}/usuario/${user.id_usuario}`);

  if (!res.ok) {
    return [];
  }

  const data = await res.json();

  return data.map(normalizeLote);
};
