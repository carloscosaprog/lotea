export type CalificacionUsuario = {
  id_usuario: number;
  nombre: string;
  avatar?: string | null;
};

export type CalificacionLote = {
  id_lote: number;
  titulo: string;
};

export type CalificacionPedido = {
  id_pedido: number;
  fecha: string;
  detalles?: {
    lote?: CalificacionLote | null;
  }[];
};

export type Calificacion = {
  id_calificacion: number;
  id_pedido: number;
  id_comprador: number;
  id_vendedor: number;
  puntuacion: number;
  comentario?: string | null;
  fecha_creacion: string;
  comprador?: CalificacionUsuario | null;
  vendedor?: CalificacionUsuario | null;
  pedido?: CalificacionPedido | null;
};

export type ResumenCalificaciones = {
  media: number;
  total: number;
  distribucion: Record<1 | 2 | 3 | 4 | 5, number>;
};

export type CreateCalificacionPayload = {
  id_pedido: number;
  puntuacion: number;
  comentario?: string;
};
