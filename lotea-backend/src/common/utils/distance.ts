export interface Coordinates {
  latitud: number;
  longitud: number;
}

export interface BoundingBox {
  minLatitud: number;
  maxLatitud: number;
  minLongitud: number;
  maxLongitud: number;
}

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export const calculateDistanceKm = (
  origin: Coordinates,
  destination: Coordinates,
) => {
  const deltaLatitud = toRadians(destination.latitud - origin.latitud);
  const deltaLongitud = toRadians(destination.longitud - origin.longitud);
  const originLatitud = toRadians(origin.latitud);
  const destinationLatitud = toRadians(destination.latitud);

  const a =
    Math.sin(deltaLatitud / 2) * Math.sin(deltaLatitud / 2) +
    Math.cos(originLatitud) *
      Math.cos(destinationLatitud) *
      Math.sin(deltaLongitud / 2) *
      Math.sin(deltaLongitud / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
};

export const roundDistanceKm = (distanceKm: number) =>
  Math.round(distanceKm * 10) / 10;

export const approximateCoordinates = (
  coordinates: Coordinates,
): Coordinates => ({
  latitud: Math.round(coordinates.latitud * 100) / 100,
  longitud: Math.round(coordinates.longitud * 100) / 100,
});

export const getBoundingBox = (
  origin: Coordinates,
  radiusKm: number,
): BoundingBox => {
  const latitudDelta = radiusKm / 111.32;
  const longitudDelta =
    radiusKm / (111.32 * Math.cos(toRadians(origin.latitud)) || 1);

  return {
    minLatitud: origin.latitud - latitudDelta,
    maxLatitud: origin.latitud + latitudDelta,
    minLongitud: origin.longitud - longitudDelta,
    maxLongitud: origin.longitud + longitudDelta,
  };
};
