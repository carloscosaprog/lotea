import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { CreateGrupoCompraDto } from './dto/CreateGrupoCompraDto';
import { CreateParticipacionDto } from './dto/CreateParticipacionDto';
import { GruposCompraService } from './grupos-compra.service';

@Controller('grupos-compra')
export class GruposCompraController {
  constructor(private readonly gruposCompraService: GruposCompraService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateGrupoCompraDto, @CurrentUser() user: JwtUser) {
    return this.gruposCompraService.create(dto, user.sub);
  }

  @Get()
  findAll() {
    return this.gruposCompraService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.gruposCompraService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/unirse')
  unirse(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateParticipacionDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.gruposCompraService.unirse(id, dto, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cerrar')
  cerrar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.gruposCompraService.cerrar(id, user.sub);
  }
}
