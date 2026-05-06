export interface Lote {
  id_lote: number;
  titulo: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  id_vendedor: number;

  vendedor?: {
    id_usuario: number;
    nombre: string;
  } | null;

  categoria?: string;
  categorias: string[];

  imagen?: string;
  imagenes: string[];

  total_favoritos?: number;
}

export type LoteCreate = {
  titulo: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  id_categoria?: number;
};

export type LoteUpdate = {
  titulo?: string;
  descripcion?: string;
  precio?: number;
  cantidad?: number;
  id_categoria?: number;
};
