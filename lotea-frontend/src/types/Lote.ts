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
  };
  categoria?: string;
  categorias: string[];

  // mantener por compatibilidad
  imagen?: string;

  // formato estándar
  imagenes: string[];

  // favoritos
  total_favoritos?: number;
}

export type LoteCreate = {
  titulo: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  id_categoria?: number;
  categoria?: string;
  categorias: string[];
};

export type LoteUpdate = {
  titulo?: string;
  descripcion?: string;
  precio?: number;
  cantidad?: number;
  id_categoria?: number;
  categoria?: string;
  categorias?: string[];
  imagenes?: string[];
};
