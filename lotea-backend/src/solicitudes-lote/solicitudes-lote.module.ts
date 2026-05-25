import { Module } from '@nestjs/common';
import { SolicitudesLoteController } from './solicitudes-lote.controller';
import { SolicitudesLoteService } from './solicitudes-lote.service';

@Module({
  controllers: [SolicitudesLoteController],
  providers: [SolicitudesLoteService],
})
export class SolicitudesLoteModule {}
