import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../config/api";
import type {
  Calificacion,
  CreateCalificacionPayload,
  ResumenCalificaciones,
} from "../types/Calificacion";

const authHeaders = async () => {
  const token = await AsyncStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const normalizeCalificacion = (raw: any): Calificacion => ({
  ...raw,
  puntuacion: Number(raw?.puntuacion ?? 0),
});

export const createCalificacion = async (
  payload: CreateCalificacionPayload,
): Promise<Calificacion> => {
  const res = await axios.post(`${API_URL}/calificaciones`, payload, {
    headers: await authHeaders(),
  });

  return normalizeCalificacion(res.data);
};

export const getCalificacionesByVendedor = async (
  id: number,
): Promise<Calificacion[]> => {
  const res = await axios.get(`${API_URL}/usuarios/${id}/calificaciones`, {
    headers: await authHeaders(),
  });

  return Array.isArray(res.data) ? res.data.map(normalizeCalificacion) : [];
};

export const getResumenCalificaciones = async (
  id: number,
): Promise<ResumenCalificaciones> => {
  const res = await axios.get(
    `${API_URL}/usuarios/${id}/resumen-calificaciones`,
    {
      headers: await authHeaders(),
    },
  );

  return {
    media: Number(res.data?.media ?? 0),
    total: Number(res.data?.total ?? 0),
    distribucion: {
      1: Number(res.data?.distribucion?.[1] ?? 0),
      2: Number(res.data?.distribucion?.[2] ?? 0),
      3: Number(res.data?.distribucion?.[3] ?? 0),
      4: Number(res.data?.distribucion?.[4] ?? 0),
      5: Number(res.data?.distribucion?.[5] ?? 0),
    },
  };
};
