import { API_URL } from "../config/api";

/**
 * Convierte rutas del backend en URLs válidas para el frontend.
 * Soporta:
 * - URLs absolutas
 * - rutas tipo /uploads/...
 * - valores vacíos
 */
export const getImageUrl = (url?: string) => {
  console.log("API_URL:", API_URL);
  if (!url || url.trim() === "") {
    return "https://picsum.photos/200";
  }

  // Si ya es una URL completa, la devolvemos
  if (url.startsWith("http")) {
    return url.replace("http://localhost:3000", API_URL);
  }

  // Si es ruta relativa, la construimos
  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};
