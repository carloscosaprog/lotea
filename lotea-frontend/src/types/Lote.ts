export interface Imagen {
  url: string;
  es_principal?: boolean;
}

export interface Lote {
  id_lote: number;
  titulo: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  id_vendedor: number;

  vendedor?: string;
  categoria?: string;

  imagen?: string;

  imagenes?: Imagen[];
}

export type LoteCreate = {
  titulo: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  id_categoria: number;
};

export type LoteUpdate = {
  titulo?: string;
  descripcion?: string;
  precio?: number;
  cantidad?: number;
  id_categoria?: number;
  imagenes?: string[];
};
