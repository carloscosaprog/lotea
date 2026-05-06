import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLoteDto } from "./dto/CreateLoteDto";
import { UpdateLoteDto } from "./dto/UpdateLoteDto";

@Injectable()
export class LotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateLoteDto,
    id_vendedor: number,
    files: Express.Multer.File[],
  ) {
    const lote = await this.prisma.lote.create({
      data: { ...dto, id_vendedor },
    });

    // guardar imágenes
    if (files && files.length > 0) {
      await this.prisma.imagen.createMany({
        data: files.map((file) => ({
          url: `/uploads/${file.filename}`,
          id_lote: lote.id_lote,
        })),
      });
    }

    // devolver lote con imágenes
    return this.prisma.lote.findUnique({
      where: { id_lote: lote.id_lote },
      include: {
        categoria: true,
        imagenes: true,
      },
    });
  }

  async findAll() {
    return this.prisma.lote.findMany({
      include: {
        categoria: true,
        vendedor: { select: { id_usuario: true, nombre: true } },
        imagenes: true,
      },
    });
  }

  async findOne(id: number) {
    const lote = await this.prisma.lote.findUnique({
      where: { id_lote: id },
      include: {
        categoria: true,
        vendedor: { select: { id_usuario: true, nombre: true } },
        imagenes: true,
      },
    });
    if (!lote) throw new NotFoundException(`Lote ${id} no encontrado`);
    return lote;
  }

  async update(id: number, dto: UpdateLoteDto, id_usuario: number) {
    const lote = await this.findOne(id);
    if (lote.id_vendedor !== id_usuario)
      throw new ForbiddenException("No puedes editar este lote");
    return this.prisma.lote.update({ where: { id_lote: id }, data: dto });
  }

  async remove(id: number, id_usuario: number) {
    const lote = await this.findOne(id);
    if (lote.id_vendedor !== id_usuario)
      throw new ForbiddenException("No puedes eliminar este lote");
    await this.prisma.lote.delete({ where: { id_lote: id } });
    return { message: `Lote ${id} eliminado` };
  }

  async findByVendedor(id_vendedor: number) {
    return this.prisma.lote.findMany({
      where: { id_vendedor },
      include: { categoria: true, imagenes: true },
    });
  }
}
