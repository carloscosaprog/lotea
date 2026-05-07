import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLoteDto } from "./dto/CreateLoteDto";
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
      },
    },
    imagenes: true,

    _count: {
      select: {
        favoritos: true,
      },
    },
  };

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

  async findAll() {
    return this.prisma.lote.findMany({
      include: this.loteInclude,
      orderBy: { fecha_publicacion: "desc" },
    });
  }

  async findOne(id: number) {
    const lote = await this.prisma.lote.findUnique({
      where: { id_lote: id },
      include: this.loteInclude,
    });

    if (!lote) {
      throw new NotFoundException(`Lote ${id} no encontrado`);
    }

    return lote;
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

  async findByVendedor(id_vendedor: number) {
    return this.prisma.lote.findMany({
      where: { id_vendedor },
      include: this.loteInclude,
      orderBy: { fecha_publicacion: "desc" },
    });
  }
}
