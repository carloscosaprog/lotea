import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../config/api";
import { normalizeLote } from "./lotesService";
import type { CreatePedidoPayload, Pedido } from "../types/Pedido";

const normalizePedido = (raw: any): Pedido => ({
  ...raw,
  detalles: Array.isArray(raw?.detalles)
    ? raw.detalles.map((detalle: any) => ({
        ...detalle,
        cantidad: Number(detalle.cantidad ?? 0),
        precio_unitario: Number(detalle.precio_unitario ?? 0),
        lote: normalizeLote(detalle.lote),
      }))
    : [],
});

const authHeaders = async () => {
  const token = await AsyncStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const getPedidos = async (): Promise<Pedido[]> => {
  const res = await axios.get(`${API_URL}/pedidos`, {
    headers: await authHeaders(),
  });

  return Array.isArray(res.data) ? res.data.map(normalizePedido) : [];
};

export const getPedidoById = async (id: number): Promise<Pedido> => {
  const res = await axios.get(`${API_URL}/pedidos/${id}`, {
    headers: await authHeaders(),
  });

  return normalizePedido(res.data);
};

export const createPedido = async (
  payload: CreatePedidoPayload,
): Promise<Pedido> => {
  const res = await axios.post(`${API_URL}/pedidos`, payload, {
    headers: await authHeaders(),
  });

  return normalizePedido(res.data);
};

export const simularSiguienteEstado = async (
  id: number,
): Promise<Pedido> => {
  const res = await axios.patch(
    `${API_URL}/pedidos/${id}/simular-siguiente-estado`,
    {},
    {
      headers: await authHeaders(),
    },
  );

  return normalizePedido(res.data);
};
