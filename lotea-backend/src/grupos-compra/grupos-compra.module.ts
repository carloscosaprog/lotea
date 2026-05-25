import { Module } from '@nestjs/common';
import { GruposCompraController } from './grupos-compra.controller';
import { GruposCompraService } from './grupos-compra.service';

@Module({
  controllers: [GruposCompraController],
  providers: [GruposCompraService],
})
export class GruposCompraModule {}
