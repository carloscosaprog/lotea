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
    latitud?: number | null;
    longitud?: number | null;
    ciudad?: string | null;
    direccion?: string | null;
  } | null;

  distancia_km?: number;
  ciudad?: string | null;
  direccion?: string | null;
  latitud?: number | null;
  longitud?: number | null;

  categoria?: string;
  categorias: string[];
  categoriasIds?: number[];

  imagen?: string;
  imagenes: string[];

  total_favoritos?: number;
  isFavorito?: boolean;
}

export type LoteCreate = {
  titulo: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  id_categoria?: number;
  categoriasIds?: number[];
};

export type LoteUpdate = {
  titulo?: string;
  descripcion?: string;
  precio?: number;
  cantidad?: number;
  id_categoria?: number;
  categoriasIds?: number[];
};

export type ImagenLote = {
  id_imagen: number;
  id_lote: number;
  url: string;
  es_principal?: boolean;
};
