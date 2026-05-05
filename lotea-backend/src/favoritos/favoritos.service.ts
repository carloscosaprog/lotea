import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFavoritoDto } from './dto/CreateFavoritoDto';

@Injectable()
export class FavoritosService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateFavoritoDto, id_usuario: number) {
    return this.prisma.favorito.create({
      data: { id_usuario, id_lote: dto.id_lote },
    });
  }

  findByUsuario(id_usuario: number) {
    return this.prisma.favorito.findMany({
      where: { id_usuario },
      include: { lote: { include: { imagenes: true } } },
    });
  }

  async remove(id_usuario: number, id_lote: number) {
    const fav = await this.prisma.favorito.findUnique({
      where: { id_usuario_id_lote: { id_usuario, id_lote } },
    });
    if (!fav) throw new NotFoundException('Favorito no encontrado');
    await this.prisma.favorito.delete({
      where: { id_usuario_id_lote: { id_usuario, id_lote } },
    });
    return { message: 'Favorito eliminado' };
  }
}
