import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateImagenLoteDto } from './dto/CreateImagenLoteDto';
import { ImagenesLoteService } from './imagenes-lote.service';

@Controller('imagenes-lote')
export class ImagenesLoteController {
  constructor(private readonly imagenesLoteService: ImagenesLoteService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateImagenLoteDto) {
    return this.imagenesLoteService.create(dto);
  }

  @Get('lote/:id')
  findByLote(@Param('id', ParseIntPipe) id: number) {
    return this.imagenesLoteService.findByLote(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.imagenesLoteService.remove(id);
  }
}
