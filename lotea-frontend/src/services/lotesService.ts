import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../config/api";
import type { Lote, LoteCreate, LoteUpdate } from "../types/Lote";

const LOTES_URL = `${API_URL}/lotes`;

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await AsyncStorage.getItem("token");

  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const normalizeLote = (raw: any): Lote => {
  const lote = raw?.lote ?? raw ?? {};

  const imagenes = Array.isArray(lote.imagenes)
    ? lote.imagenes
        .map((img: any) => (typeof img === "string" ? img : img?.url))
        .filter(
          (url: any): url is string =>
            typeof url === "string" && url.length > 0,
        )
    : typeof lote.imagen === "string" && lote.imagen.length > 0
      ? [lote.imagen]
      : [];

  const categoria =
    typeof lote.categoria === "string"
      ? lote.categoria
      : typeof lote.categoria?.nombre === "string"
        ? lote.categoria.nombre
        : undefined;

  const categorias = Array.isArray(lote.categorias)
    ? lote.categorias
        .map((cat: any) => (typeof cat === "string" ? cat : cat?.nombre))
        .filter(
          (cat: any): cat is string =>
            typeof cat === "string" && cat.length > 0,
        )
    : categoria
      ? [categoria]
      : [];

  const vendedor =
    lote.vendedor && typeof lote.vendedor === "object"
      ? {
          id_usuario: lote.vendedor.id_usuario,
          nombre: lote.vendedor.nombre ?? "Usuario",
        }
      : null;
  const isFavorito =
    typeof lote.isFavorito === "boolean" ? lote.isFavorito : false;
  return {
    ...lote,

    vendedor,
    categoria,
    categorias,
    imagenes,
    isFavorito,

    total_favoritos:
      typeof lote.total_favoritos === "number"
        ? lote.total_favoritos
        : (lote._count?.favoritos ?? 0),
  };
};

const buildImageFile = (file: any, index: number) => {
  const uri = file?.uri || file?.assets?.[0]?.uri;

  if (!uri) return null;

  const filename =
    file?.fileName ||
    file?.name ||
    uri.split("/").pop() ||
    `image_${index}.jpg`;
  const mimeType =
    file?.mimeType ||
    file?.type ||
    `image/${filename.split(".").pop() || "jpeg"}`;

  return {
    uri,
    name: filename,
    type: mimeType,
  };
};

export const getLotes = async (): Promise<Lote[]> => {
  const headers = await getAuthHeaders();

  const response = await fetch(LOTES_URL, {
    headers,
  });

  if (!response.ok) {
    throw new Error("Error al obtener lotes");
  }

  const data = await response.json();

  return Array.isArray(data) ? data.map(normalizeLote) : [];
};

export const getLoteById = async (id: number): Promise<Lote | undefined> => {
  const response = await fetch(`${LOTES_URL}/${id}`);

  if (!response.ok) return undefined;

  const data = await response.json();

  return normalizeLote(data);
};

export const createLote = async (
  lote: LoteCreate,
  files: any[],
): Promise<Lote> => {
  const headers = await getAuthHeaders();
  const formData = new FormData();

  formData.append("titulo", lote.titulo);
  formData.append("descripcion", lote.descripcion ?? "");
  formData.append("precio", String(lote.precio));
  formData.append("cantidad", String(lote.cantidad));

  if (lote.id_categoria) {
    formData.append("id_categoria", String(lote.id_categoria));
  }

  files.forEach((file, index) => {
    const image = buildImageFile(file, index);
    if (image) {
      formData.append("imagenesFiles", image as any);
    }
  });

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

export const updateLote = async (
  id: number,
  lote: LoteUpdate,
): Promise<Lote> => {
  const headers = await getAuthHeaders();

  const response = await fetch(`${LOTES_URL}/${id}`, {
    method: "PATCH",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(lote),
  });

  if (!response.ok) {
    const text = await response.text();
    console.log("ERROR BACKEND:", text);
    throw new Error("Error al actualizar lote");
  }

  const data = await response.json();

  return normalizeLote(data);
};

export const deleteLote = async (id: number): Promise<boolean> => {
  const headers = await getAuthHeaders();

  const response = await fetch(`${LOTES_URL}/${id}`, {
    method: "DELETE",
    headers,
  });

  return response.ok;
};

export const getLotesByUser = async (id: number): Promise<Lote[]> => {
  const headers = await getAuthHeaders();

  const res = await fetch(`${LOTES_URL}/vendedor/${id}`, {
    headers,
  });

  if (!res.ok) return [];

  const data = await res.json();

  return Array.isArray(data) ? data.map(normalizeLote) : [];
};

export const getMisLotes = async (): Promise<Lote[]> => {
  const userString = await AsyncStorage.getItem("user");

  if (!userString) {
    return [];
  }

  const user = JSON.parse(userString);
  const userId = user?.id_usuario ?? user?.id;

  if (!userId) {
    return [];
  }

  return getLotesByUser(userId);
};
