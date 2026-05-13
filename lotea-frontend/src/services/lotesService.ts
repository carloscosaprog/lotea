import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../config/api";
import type { Lote, LoteCreate, LoteUpdate } from "../types/Lote";

const LOTES_URL = `${API_URL}/lotes`;

export type LoteQuery = {
  maxDistance?: number;
  sortBy?: "newest" | "nearest";
};

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
        .map((cat: any) =>
          typeof cat === "string" ? cat : cat?.nombre ?? cat?.categoria?.nombre,
        )
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
          latitud:
            typeof lote.vendedor.latitud === "number"
              ? lote.vendedor.latitud
              : null,
          longitud:
            typeof lote.vendedor.longitud === "number"
              ? lote.vendedor.longitud
              : null,
          ciudad:
            typeof lote.vendedor.ciudad === "string"
              ? lote.vendedor.ciudad
              : null,
          direccion:
            typeof lote.vendedor.direccion === "string"
              ? lote.vendedor.direccion
              : null,
        }
      : null;
  const isFavorito =
    typeof lote.isFavorito === "boolean" ? lote.isFavorito : false;
  const distancia_km =
    typeof lote.distancia_km === "number" ? lote.distancia_km : undefined;
  const ciudad =
    typeof lote.ciudad === "string" ? lote.ciudad : vendedor?.ciudad ?? null;
  const direccion =
    typeof lote.direccion === "string"
      ? lote.direccion
      : vendedor?.direccion ?? null;
  const latitud =
    typeof lote.latitud === "number" ? lote.latitud : vendedor?.latitud ?? null;
  const longitud =
    typeof lote.longitud === "number"
      ? lote.longitud
      : vendedor?.longitud ?? null;

  return {
    ...lote,

    vendedor,
    distancia_km,
    ciudad,
    direccion,
    latitud,
    longitud,
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

const buildLotesUrl = (query?: LoteQuery) => {
  const params = new URLSearchParams();

  if (typeof query?.maxDistance === "number") {
    params.append("maxDistance", String(query.maxDistance));
  }

  if (query?.sortBy) {
    params.append("sortBy", query.sortBy);
  }

  const queryString = params.toString();

  return queryString ? `${LOTES_URL}?${queryString}` : LOTES_URL;
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

export const getLotes = async (query?: LoteQuery): Promise<Lote[]> => {
  const headers = await getAuthHeaders();

  // console.log("HEADERS LOTES:", headers); // mostrar el header

  const response = await fetch(buildLotesUrl(query), {
    headers,
  });

  if (!response.ok) {
    const text = await response.text();

    console.log("ERROR LOTES:", response.status, text);

    throw new Error("Error al obtener lotes");
  }

  const data = await response.json();

  return Array.isArray(data) ? data.map(normalizeLote) : [];
};

export const getLoteById = async (id: number): Promise<Lote | undefined> => {
  const headers = await getAuthHeaders();

  const response = await fetch(`${LOTES_URL}/${id}`, {
    headers,
  });

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

  if (lote.categoriasIds?.length) {
    formData.append("categoriasIds", JSON.stringify(lote.categoriasIds));
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
