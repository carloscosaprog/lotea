import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { CreateSolicitudLoteDto } from './dto/CreateSolicitudLoteDto';
import { UpdateSolicitudLoteDto } from './dto/UpdateSolicitudLoteDto';
import { SolicitudesLoteService } from './solicitudes-lote.service';

@Controller('solicitudes-lote')
export class SolicitudesLoteController {
  constructor(private readonly solicitudesLoteService: SolicitudesLoteService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateSolicitudLoteDto, @CurrentUser() user: JwtUser) {
    return this.solicitudesLoteService.create(dto, user.sub);
  }

  @Get()
  findAll() {
    return this.solicitudesLoteService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('mis-solicitudes')
  findMine(@CurrentUser() user: JwtUser) {
    return this.solicitudesLoteService.findByUsuario(user.sub);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.solicitudesLoteService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSolicitudLoteDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.solicitudesLoteService.update(id, dto, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.solicitudesLoteService.remove(id, user.sub);
  }
}
