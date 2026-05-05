import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateImagenLoteDto } from './dto/CreateImagenLoteDto';

@Injectable()
export class ImagenesLoteService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateImagenLoteDto) {
    return this.prisma.imagen_Lote.create({ data: dto });
  }

  findByLote(id_lote: number) {
    return this.prisma.imagen_Lote.findMany({ where: { id_lote } });
  }

  async remove(id: number) {
    const img = await this.prisma.imagen_Lote.findUnique({ where: { id_imagen: id } });
    if (!img) throw new NotFoundException(`Imagen ${id} no encontrada`);
    await this.prisma.imagen_Lote.delete({ where: { id_imagen: id } });
    return { message: `Imagen ${id} eliminada` };
  }
}
