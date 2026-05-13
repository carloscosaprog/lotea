import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  approximateCoordinates,
  calculateDistanceKm,
  Coordinates,
  getBoundingBox,
  roundDistanceKm,
} from "../common/utils/distance";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLoteDto } from "./dto/CreateLoteDto";
import { LoteQueryDto } from "./dto/LoteQueryDto";
import { UpdateLoteDto } from "./dto/UpdateLoteDto";

@Injectable()
export class LotesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly loteInclude = {
    categoria: true,
    vendedor: {
      select: {
        id_usuario: true,
        nombre: true,
        latitud: true,
        longitud: true,
        ciudad: true,
        direccion: true,
      },
    },
    imagenes: true,

    _count: {
      select: {
        favoritos: true,
      },
    },
  };

  private async getUserCoordinates(
    id_usuario?: number | null,
  ): Promise<Coordinates | null> {
    if (!id_usuario) {
      return null;
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario },
      select: {
        latitud: true,
        longitud: true,
      },
    });

    if (
      typeof usuario?.latitud !== "number" ||
      typeof usuario?.longitud !== "number"
    ) {
      return null;
    }

    return {
      latitud: usuario.latitud,
      longitud: usuario.longitud,
    };
  }

  private addLocationData(lote: any, origin: Coordinates | null) {
    const vendedor = lote.vendedor;
    const hasSellerCoordinates =
      typeof vendedor?.latitud === "number" &&
      typeof vendedor?.longitud === "number";
    const distancia_km =
      origin && hasSellerCoordinates
        ? roundDistanceKm(
            calculateDistanceKm(origin, {
              latitud: vendedor.latitud,
              longitud: vendedor.longitud,
            }),
          )
        : undefined;
    const approximateSellerCoordinates = hasSellerCoordinates
      ? approximateCoordinates({
          latitud: vendedor.latitud,
          longitud: vendedor.longitud,
        })
      : null;

    return {
      ...lote,
      vendedor: vendedor
        ? {
            ...vendedor,
            latitud: approximateSellerCoordinates?.latitud ?? null,
            longitud: approximateSellerCoordinates?.longitud ?? null,
            direccion: vendedor.direccion ?? null,
          }
        : vendedor,
      ciudad: vendedor?.ciudad ?? undefined,
      direccion: vendedor?.direccion ?? undefined,
      latitud: approximateSellerCoordinates?.latitud ?? undefined,
      longitud: approximateSellerCoordinates?.longitud ?? undefined,
      distancia_km,
    };
  }

  async create(
    dto: CreateLoteDto,
    id_vendedor: number,
    files: Express.Multer.File[] = [],
  ) {
    const lote = await this.prisma.lote.create({
      data: { ...dto, id_vendedor },
    });

    const imagenes = files.filter((file) => Boolean(file.filename));

    if (imagenes.length > 0) {
      await this.prisma.imagen_Lote.createMany({
        data: imagenes.map((file, index) => ({
          url: `/uploads/${file.filename}`,
          id_lote: lote.id_lote,
          es_principal: index === 0,
        })),
      });
    }

    return this.prisma.lote.findUnique({
      where: { id_lote: lote.id_lote },
      include: this.loteInclude,
    });
  }

  async findAll(query: LoteQueryDto = {}, id_usuario?: number) {
    const origin = await this.getUserCoordinates(id_usuario);
    const maxDistance =
      typeof query.maxDistance === "number" && query.maxDistance > 0
        ? query.maxDistance
        : undefined;
    const where: any = {};

    if (origin && maxDistance) {
      const boundingBox = getBoundingBox(origin, maxDistance);

      where.vendedor = {
        latitud: {
          gte: boundingBox.minLatitud,
          lte: boundingBox.maxLatitud,
        },
        longitud: {
          gte: boundingBox.minLongitud,
          lte: boundingBox.maxLongitud,
        },
      };
    }

    const lotes = await this.prisma.lote.findMany({
      where,
      include: this.loteInclude,
      orderBy: {
        fecha_publicacion: "desc",
      },
    });

    const lotesWithLocation = lotes
      .map((lote) => this.addLocationData(lote, origin))
      .filter((lote) =>
        origin && maxDistance ? (lote.distancia_km ?? Infinity) <= maxDistance : true,
      );

    if (origin && query.sortBy === "nearest") {
      return lotesWithLocation.sort(
        (a, b) => (a.distancia_km ?? Infinity) - (b.distancia_km ?? Infinity),
      );
    }

    return lotesWithLocation;
  }

  async findOne(id: number, id_usuario?: number) {
    const origin = await this.getUserCoordinates(id_usuario);
    const lote = await this.prisma.lote.findUnique({
      where: { id_lote: id },
      include: this.loteInclude,
    });

    if (!lote) {
      throw new NotFoundException(`Lote ${id} no encontrado`);
    }

    return this.addLocationData(lote, origin);
  }

  async update(id: number, dto: UpdateLoteDto, id_usuario: number) {
    const lote = await this.findOne(id);

    if (lote.id_vendedor !== id_usuario) {
      throw new ForbiddenException("No puedes editar este lote");
    }

    return this.prisma.lote.update({
      where: { id_lote: id },
      data: dto,
      include: this.loteInclude,
    });
  }

  async remove(id: number, id_usuario: number) {
    const lote = await this.findOne(id);

    if (lote.id_vendedor !== id_usuario) {
      throw new ForbiddenException("No puedes eliminar este lote");
    }

    await this.prisma.lote.delete({ where: { id_lote: id } });

    return { message: `Lote ${id} eliminado` };
  }

  async findByVendedor(id_vendedor: number, id_usuario: number) {
    const origin = await this.getUserCoordinates(id_usuario);
    const lotes = await this.prisma.lote.findMany({
      where: {
        id_vendedor,
      },

      include: {
        ...this.loteInclude,

        favoritos: {
          where: {
            id_usuario,
          },

          select: {
            id_favorito: true,
          },
        },
      },

      orderBy: {
        fecha_publicacion: "desc",
      },
    });

    return lotes.map((lote) => ({
      ...this.addLocationData(lote, origin),

      isFavorito: lote.favoritos.length > 0,
    }));
  }
}
