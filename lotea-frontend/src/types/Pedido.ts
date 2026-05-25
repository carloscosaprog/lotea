import type { Lote } from "./Lote";

export type EstadoPedido =
  | "pendiente_pago"
  | "pagado"
  | "preparando"
  | "enviado"
  | "entregado"
  | "cancelado";

export type MetodoPago =
  | "tarjeta"
  | "paypal"
  | "bizum"
  | "transferencia";

export type DetallePedido = {
  id_detalle: number;
  id_pedido: number;
  id_lote: number;
  cantidad: number;
  precio_unitario: number;
  lote: Lote;
};

export type Pedido = {
  id_pedido: number;
  id_usuario: number;
  fecha: string;
  fecha_actualizacion?: string;
  estado: EstadoPedido;
  metodo_pago?: MetodoPago | null;
  direccion_entrega?: string | null;
  detalles: DetallePedido[];
};

export type CreatePedidoPayload = {
  id_lote: number;
  cantidad: number;
  metodo_pago: MetodoPago;
  direccion_entrega?: string;
};
