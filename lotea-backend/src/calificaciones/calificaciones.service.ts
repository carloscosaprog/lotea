import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCalificacionDto } from './dto/CreateCalificacionDto';

@Injectable()
export class CalificacionesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly calificacionInclude = {
    comprador: {
      select: {
        id_usuario: true,
        nombre: true,
        avatar: true,
      },
    },
    vendedor: {
      select: {
        id_usuario: true,
        nombre: true,
        avatar: true,
      },
    },
    pedido: {
      select: {
        id_pedido: true,
        fecha: true,
        detalles: {
          take: 1,
          include: {
            lote: {
              select: {
                id_lote: true,
                titulo: true,
              },
            },
          },
        },
      },
    },
  };

  async create(dto: CreateCalificacionDto, id_comprador: number) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id_pedido: dto.id_pedido },
      include: {
        calificacion: true,
        detalles: {
          include: {
            lote: {
              select: {
                id_lote: true,
                titulo: true,
                id_vendedor: true,
              },
            },
          },
        },
      },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (pedido.id_usuario !== id_comprador) {
      throw new ForbiddenException('Solo el comprador del pedido puede valorar');
    }

    if (pedido.estado !== 'entregado') {
      throw new BadRequestException('Solo puedes valorar pedidos entregados');
    }

    if (pedido.calificacion) {
      throw new ConflictException('Este pedido ya tiene una valoracion');
    }

    const lote = pedido.detalles[0]?.lote;

    if (!lote) {
      throw new BadRequestException('El pedido no tiene un lote asociado');
    }

    if (lote.id_vendedor === id_comprador) {
      throw new ForbiddenException('No puedes valorar tu propio lote');
    }

    const comentario = dto.comentario?.trim() || null;

    try {
      return await this.prisma.calificacion.create({
        data: {
          id_pedido: pedido.id_pedido,
          id_comprador,
          id_vendedor: lote.id_vendedor,
          puntuacion: dto.puntuacion,
          comentario,
        },
        include: this.calificacionInclude,
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Este pedido ya tiene una valoracion');
      }

      throw error;
    }
  }

  findByVendedor(id_vendedor: number) {
    return this.prisma.calificacion.findMany({
      where: { id_vendedor },
      include: this.calificacionInclude,
      orderBy: { fecha_creacion: 'desc' },
    });
  }

  async getResumenByVendedor(id_vendedor: number) {
    const [aggregate, groups] = await Promise.all([
      this.prisma.calificacion.aggregate({
        where: { id_vendedor },
        _avg: { puntuacion: true },
        _count: { _all: true },
      }),
      this.prisma.calificacion.groupBy({
        by: ['puntuacion'],
        where: { id_vendedor },
        _count: { _all: true },
      }),
    ]);

    const distribucion = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    groups.forEach((group) => {
      distribucion[group.puntuacion as keyof typeof distribucion] =
        group._count._all;
    });

    const total = aggregate._count._all;
    const media = aggregate._avg.puntuacion
      ? Number(aggregate._avg.puntuacion.toFixed(1))
      : 0;

    return {
      media,
      total,
      distribucion,
    };
  }
}
