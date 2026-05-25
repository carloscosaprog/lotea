import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePedidoDto } from './dto/CreatePedidoDto';
import { UpdatePedidoDto } from './dto/UpdatePedidoDto';

@Injectable()
export class PedidosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePedidoDto, id_usuario: number) {
    return this.prisma.pedido.create({
      data: {
        id_usuario,
        detalles: {
          create: dto.detalles.map((d) => ({
            id_lote: d.id_lote,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
          })),
        },
      },
      include: { detalles: true },
    });
  }

  findByUsuario(id_usuario: number) {
    return this.prisma.pedido.findMany({
      where: { id_usuario },
      include: { detalles: { include: { lote: true } } },
    });
  }

  async findOne(id: number) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id_pedido: id },
      include: { detalles: { include: { lote: true } } },
    });
    if (!pedido) throw new NotFoundException(`Pedido ${id} no encontrado`);
    return pedido;
  }

  async update(id: number, dto: UpdatePedidoDto) {
    await this.findOne(id);
    return this.prisma.pedido.update({
      where: { id_pedido: id },
      data: { estado: dto.estado as any },
    });
  }
}
