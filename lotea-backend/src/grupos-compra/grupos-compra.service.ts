import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGrupoCompraDto } from './dto/CreateGrupoCompraDto';
import { CreateParticipacionDto } from './dto/CreateParticipacionDto';

@Injectable()
export class GruposCompraService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateGrupoCompraDto, id_creador: number) {
    return this.prisma.grupo_Compra.create({
      data: { ...dto, id_creador },
      include: { lote: true, creador: { select: { id_usuario: true, nombre: true } } },
    });
  }

  findAll() {
    return this.prisma.grupo_Compra.findMany({
      where: { estado: 'abierto' },
      include: {
        lote: true,
        creador: { select: { id_usuario: true, nombre: true } },
        participaciones: true,
      },
    });
  }

  async findOne(id: number) {
    const grupo = await this.prisma.grupo_Compra.findUnique({
      where: { id_grupo: id },
      include: {
        lote: true,
        creador: { select: { id_usuario: true, nombre: true } },
        participaciones: { include: { usuario: { select: { id_usuario: true, nombre: true } } } },
      },
    });
    if (!grupo) throw new NotFoundException(`Grupo ${id} no encontrado`);
    return grupo;
  }

  async unirse(id_grupo: number, dto: CreateParticipacionDto, id_usuario: number) {
    const grupo = await this.findOne(id_grupo);
    if (grupo.estado === 'cerrado') throw new ForbiddenException('El grupo ya está cerrado');
    return this.prisma.participacion_Grupo.create({
      data: { id_grupo, id_usuario, cantidad_aportada: dto.cantidad_aportada },
    });
  }

  async cerrar(id_grupo: number, id_usuario: number) {
    const grupo = await this.findOne(id_grupo);
    if (grupo.id_creador !== id_usuario) throw new ForbiddenException('Solo el creador puede cerrar el grupo');
    return this.prisma.grupo_Compra.update({
      where: { id_grupo },
      data: { estado: 'cerrado' },
    });
  }
}
