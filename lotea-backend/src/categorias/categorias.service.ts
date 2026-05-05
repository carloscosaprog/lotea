import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoriaDto } from './dto/CreateCategoriaDto';
import { UpdateCategoriaDto } from './dto/UpdateCategoriaDto';

@Injectable()
export class CategoriasService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCategoriaDto) {
    return this.prisma.categoria.create({ data: dto });
  }

  findAll() {
    return this.prisma.categoria.findMany();
  }

  async findOne(id: number) {
    const cat = await this.prisma.categoria.findUnique({ where: { id_categoria: id } });
    if (!cat) throw new NotFoundException(`Categoría ${id} no encontrada`);
    return cat;
  }

  async update(id: number, dto: UpdateCategoriaDto) {
    await this.findOne(id);
    return this.prisma.categoria.update({ where: { id_categoria: id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.categoria.delete({ where: { id_categoria: id } });
    return { message: `Categoría ${id} eliminada` };
  }
}
