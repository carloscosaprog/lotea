import { API_URL } from "../config/api";

export const getImageUrl = (url?: string | null) => {
  const safeUrl = typeof url === "string" ? url.trim() : "";

  if (!safeUrl) {
    return "https://picsum.photos/300";
  }

  if (safeUrl.startsWith("http")) {
    return safeUrl.replace("http://localhost:3000", API_URL);
  }

  return `${API_URL}${safeUrl.startsWith("/") ? "" : "/"}${safeUrl}`;
};
