import type { Lote } from "./Lote";
import type { Calificacion } from "./Calificacion";

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
  usuario?: {
    id_usuario: number;
    nombre: string;
    email?: string;
    ciudad?: string | null;
    direccion?: string | null;
    avatar?: string | null;
  } | null;
  detalles: DetallePedido[];
  calificacion?: Calificacion | null;
};

export type CreatePedidoPayload = {
  id_lote: number;
  cantidad: number;
  metodo_pago: MetodoPago;
  direccion_entrega?: string;
};
