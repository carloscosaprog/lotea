import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePedidoDto } from './dto/CreatePedidoDto';
import { UpdatePedidoDto } from './dto/UpdatePedidoDto';

@Injectable()
export class PedidosService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly pedidoInclude = {
    usuario: {
      select: {
        id_usuario: true,
        nombre: true,
        email: true,
        ciudad: true,
        direccion: true,
        avatar: true,
      },
    },
    detalles: {
      include: {
        lote: {
          include: {
            imagenes: true,
            vendedor: {
              select: {
                id_usuario: true,
                nombre: true,
                email: true,
                ciudad: true,
                direccion: true,
                avatar: true,
              },
            },
          },
        },
      },
    },
  };

  private readonly estadosSimulacion = [
    'pagado',
    'preparando',
    'enviado',
    'entregado',
  ] as const;

  async create(dto: CreatePedidoDto, id_usuario: number) {
    const detalle = dto.detalles?.[0];
    const id_lote = dto.id_lote ?? detalle?.id_lote;
    const cantidad = dto.cantidad ?? detalle?.cantidad;

    if (!id_lote || !cantidad || cantidad < 1) {
      throw new BadRequestException('Selecciona una cantidad valida');
    }

    return this.prisma.$transaction(async (tx) => {
      const lote = await tx.lote.findUnique({
        where: { id_lote },
        include: {
          vendedor: {
            select: {
              id_usuario: true,
              nombre: true,
            },
          },
        },
      });

      if (!lote) {
        throw new NotFoundException(`Lote ${id_lote} no encontrado`);
      }

      if (lote.cantidad <= 0) {
        throw new BadRequestException('Este lote esta agotado');
      }

      if (cantidad > lote.cantidad) {
        throw new BadRequestException(
          `Stock insuficiente. Quedan ${lote.cantidad} unidades disponibles`,
        );
      }

      const stockUpdate = await tx.lote.updateMany({
        where: {
          id_lote,
          cantidad: {
            gte: cantidad,
          },
        },
        data: {
          cantidad: {
            decrement: cantidad,
          },
        },
      });

      if (stockUpdate.count !== 1) {
        throw new BadRequestException(
          'Stock insuficiente. Vuelve a revisar la cantidad disponible',
        );
      }

      const pedido = await tx.pedido.create({
        data: {
          id_usuario,
          estado: 'pagado',
          metodo_pago: dto.metodo_pago,
          direccion_entrega: dto.direccion_entrega?.trim() || null,
          detalles: {
            create: {
              id_lote,
              cantidad,
              precio_unitario: lote.precio,
            },
          },
        },
        include: this.pedidoInclude,
      });

      await tx.notificacion.create({
        data: {
          id_usuario: lote.id_vendedor,
          tipo: 'pedido',
          contenido: `Has recibido un nuevo pedido de ${cantidad} unidades del lote '${lote.titulo}'.`,
        },
      });

      return pedido;
    });
  }

  findByUsuario(id_usuario: number) {
    return this.prisma.pedido.findMany({
      where: { id_usuario },
      include: this.pedidoInclude,
      orderBy: { fecha: 'desc' },
    });
  }

  findVentasByVendedor(id_vendedor: number) {
    return this.prisma.pedido.findMany({
      where: {
        detalles: {
          some: {
            lote: {
              id_vendedor,
            },
          },
        },
      },
      include: this.pedidoInclude,
      orderBy: { fecha: 'desc' },
    });
  }

  async findOne(id: number, id_usuario?: number) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id_pedido: id },
      include: this.pedidoInclude,
    });
    if (!pedido) throw new NotFoundException(`Pedido ${id} no encontrado`);

    const vendedorId = pedido.detalles[0]?.lote?.id_vendedor;
    if (
      id_usuario &&
      pedido.id_usuario !== id_usuario &&
      vendedorId !== id_usuario
    ) {
      throw new ForbiddenException('No puedes consultar este pedido');
    }

    return pedido;
  }

  async update(id: number, dto: UpdatePedidoDto) {
    await this.findOne(id);
    return this.prisma.pedido.update({
      where: { id_pedido: id },
      data: { estado: dto.estado as any },
      include: this.pedidoInclude,
    });
  }

  async simularSiguienteEstado(id: number, id_usuario: number) {
    const pedido = await this.findOne(id, id_usuario);

    if (pedido.estado === 'cancelado') {
      throw new BadRequestException('No se puede avanzar un pedido cancelado');
    }

    const estadoActual = pedido.estado as (typeof this.estadosSimulacion)[number];
    const indiceActual = this.estadosSimulacion.indexOf(estadoActual);

    if (indiceActual === -1) {
      return this.prisma.pedido.update({
        where: { id_pedido: id },
        data: { estado: 'pagado' },
        include: this.pedidoInclude,
      });
    }

    if (indiceActual === this.estadosSimulacion.length - 1) {
      return pedido;
    }

    return this.prisma.pedido.update({
      where: { id_pedido: id },
      data: { estado: this.estadosSimulacion[indiceActual + 1] },
      include: this.pedidoInclude,
    });
  }
}
