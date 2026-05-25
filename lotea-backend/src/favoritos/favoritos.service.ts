import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateFavoritoDto } from "./dto/CreateFavoritoDto";

@Injectable()
export class FavoritosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFavoritoDto, id_usuario: number) {
    const existente = await this.prisma.favorito.findUnique({
      where: {
        id_usuario_id_lote: {
          id_usuario,
          id_lote: dto.id_lote,
        },
      },
    });

    if (existente) {
      return {
        favorito: true,
        message: "Ya existe en favoritos",
      };
    }

    await this.prisma.favorito.create({
      data: {
        id_usuario,
        id_lote: dto.id_lote,
      },
    });

    const total = await this.prisma.favorito.count({
      where: {
        id_lote: dto.id_lote,
      },
    });

    return {
      favorito: true,
      total_favoritos: total,
    };
  }

  findByUsuario(id_usuario: number) {
    return this.prisma.favorito.findMany({
      where: { id_usuario },

      include: {
        lote: {
          include: {
            imagenes: true,

            vendedor: {
              select: {
                id_usuario: true,
                nombre: true,
                ciudad: true,
                direccion: true,
                latitud: true,
                longitud: true,
              },
            },

            categorias: {
              include: {
                categoria: true,
              },
            },

            _count: {
              select: {
                favoritos: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id_usuario: number, id_lote: number) {
    const fav = await this.prisma.favorito.findUnique({
      where: {
        id_usuario_id_lote: {
          id_usuario,
          id_lote,
        },
      },
    });

    if (!fav) {
      return {
        favorito: false,
        message: "No existía en favoritos",
      };
    }

    await this.prisma.favorito.delete({
      where: {
        id_usuario_id_lote: {
          id_usuario,
          id_lote,
        },
      },
    });

    const total = await this.prisma.favorito.count({
      where: {
        id_lote,
      },
    });

    return {
      favorito: false,
      total_favoritos: total,
    };
  }
}
