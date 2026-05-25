import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSolicitudLoteDto } from './dto/CreateSolicitudLoteDto';
import { UpdateSolicitudLoteDto } from './dto/UpdateSolicitudLoteDto';

@Injectable()
export class SolicitudesLoteService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateSolicitudLoteDto, id_usuario: number) {
    return this.prisma.solicitud_Lote.create({
      data: { ...dto, id_usuario },
    });
  }

  findAll() {
    return this.prisma.solicitud_Lote.findMany({
      include: { usuario: { select: { id_usuario: true, nombre: true } } },
      orderBy: { fecha: 'desc' },
    });
  }

  findByUsuario(id_usuario: number) {
    return this.prisma.solicitud_Lote.findMany({
      where: { id_usuario },
      orderBy: { fecha: 'desc' },
    });
  }

  async findOne(id: number) {
    const sol = await this.prisma.solicitud_Lote.findUnique({
      where: { id_solicitud: id },
      include: { usuario: { select: { id_usuario: true, nombre: true } } },
    });
    if (!sol) throw new NotFoundException(`Solicitud ${id} no encontrada`);
    return sol;
  }

  async update(id: number, dto: UpdateSolicitudLoteDto, id_usuario: number) {
    const sol = await this.findOne(id);
    if (sol.id_usuario !== id_usuario) throw new ForbiddenException('No puedes editar esta solicitud');
    return this.prisma.solicitud_Lote.update({ where: { id_solicitud: id }, data: dto });
  }

  async remove(id: number, id_usuario: number) {
    const sol = await this.findOne(id);
    if (sol.id_usuario !== id_usuario) throw new ForbiddenException('No puedes eliminar esta solicitud');
    await this.prisma.solicitud_Lote.delete({ where: { id_solicitud: id } });
    return { message: `Solicitud ${id} eliminada` };
  }
}
