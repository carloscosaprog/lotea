import { API_URL } from "../config/api";

export const getImageUrl = (url?: string) => {
  if (!url || url.trim() === "") {
    return "https://picsum.photos/200";
  }

  return url.replace("http://localhost:3000", API_URL);
};
