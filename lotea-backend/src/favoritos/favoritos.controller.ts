import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { CreateFavoritoDto } from './dto/CreateFavoritoDto';
import { FavoritosService } from './favoritos.service';

@UseGuards(JwtAuthGuard)
@Controller('favoritos')
export class FavoritosController {
  constructor(private readonly favoritosService: FavoritosService) {}

  @Post()
  create(@Body() dto: CreateFavoritoDto, @CurrentUser() user: JwtUser) {
    return this.favoritosService.create(dto, user.sub);
  }

  @Get()
  findMine(@CurrentUser() user: JwtUser) {
    return this.favoritosService.findByUsuario(user.sub);
  }

  @Delete(':id_lote')
  remove(@Param('id_lote', ParseIntPipe) id_lote: number, @CurrentUser() user: JwtUser) {
    return this.favoritosService.remove(user.sub, id_lote);
  }
}
