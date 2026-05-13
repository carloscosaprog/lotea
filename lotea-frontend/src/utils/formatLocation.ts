import type { Lote } from "../types/Lote";

export const formatDistance = (distanceKm?: number) => {
  if (typeof distanceKm !== "number") {
    return null;
  }

  if (distanceKm < 1) {
    return "A menos de 1 km";
  }

  return `A ${distanceKm.toFixed(1)} km`;
};

export const formatLoteLocation = (lote: Lote) => {
  const distance = formatDistance(lote.distancia_km);
  const city = lote.ciudad || lote.vendedor?.ciudad;

  return [distance, city].filter(Boolean).join(" · ") || null;
};
