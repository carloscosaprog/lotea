import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/CreateUsuarioDto';
import { UpdateUsuarioDto } from './dto/UpdateUsuarioDto';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  private omitPassword(u: any) {
    const { contrasena, ...rest } = u;
    return rest;
  }

  async create(dto: CreateUsuarioDto) {
    const existe = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (existe) throw new ConflictException('El email ya está en uso');

    const hash = await bcrypt.hash(dto.contrasena, 10);
    const usuario = await this.prisma.usuario.create({
      data: { ...dto, contrasena: hash },
    });
    return this.omitPassword(usuario);
  }

  async findAll() {
    const usuarios = await this.prisma.usuario.findMany();
    return usuarios.map(this.omitPassword);
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id_usuario: id } });
    if (!usuario) throw new NotFoundException(`Usuario ${id} no encontrado`);
    return this.omitPassword(usuario);
  }

  async update(id: number, dto: UpdateUsuarioDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.contrasena) {
      data.contrasena = await bcrypt.hash(dto.contrasena, 10);
    }
    const updated = await this.prisma.usuario.update({ where: { id_usuario: id }, data });
    return this.omitPassword(updated);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.usuario.delete({ where: { id_usuario: id } });
    return { message: `Usuario ${id} eliminado` };
  }
}
