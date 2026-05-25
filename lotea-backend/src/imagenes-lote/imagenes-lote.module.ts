import { Module } from '@nestjs/common';
import { ImagenesLoteController } from './imagenes-lote.controller';
import { ImagenesLoteService } from './imagenes-lote.service';

@Module({
  controllers: [ImagenesLoteController],
  providers: [ImagenesLoteService],
})
export class ImagenesLoteModule {}
