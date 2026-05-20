import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  async addUploadedImages(
    id_lote: number,
    id_usuario: number,
    files: Express.Multer.File[] = [],
  ) {
    const lote = await this.prisma.lote.findUnique({ where: { id_lote } });

    if (!lote) {
      throw new NotFoundException(`Lote ${id_lote} no encontrado`);
    }

    if (lote.id_vendedor !== id_usuario) {
      throw new ForbiddenException('No puedes editar este lote');
    }

    const imagenes = files.filter((file) => Boolean(file.filename));

    if (imagenes.length === 0) {
      return [];
    }

    const existingCount = await this.prisma.imagen_Lote.count({
      where: { id_lote },
    });

    await this.prisma.imagen_Lote.createMany({
      data: imagenes.map((file, index) => ({
        url: `/uploads/${file.filename}`,
        id_lote,
        es_principal: existingCount === 0 && index === 0,
      })),
    });

    return this.findByLote(id_lote);
  }

  async remove(id: number, id_usuario: number) {
    const img = await this.prisma.imagen_Lote.findUnique({
      where: { id_imagen: id },
      include: { lote: true },
    });

    if (!img) throw new NotFoundException(`Imagen ${id} no encontrada`);

    if (img.lote.id_vendedor !== id_usuario) {
      throw new ForbiddenException('No puedes editar este lote');
    }

    await this.prisma.imagen_Lote.delete({ where: { id_imagen: id } });

    return { message: `Imagen ${id} eliminada` };
  }
}
