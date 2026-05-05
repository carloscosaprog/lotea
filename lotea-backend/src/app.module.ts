import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { CategoriasModule } from './categorias/categorias.module';
import { LotesModule } from './lotes/lotes.module';
import { ImagenesLoteModule } from './imagenes-lote/imagenes-lote.module';
import { FavoritosModule } from './favoritos/favoritos.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { GruposCompraModule } from './grupos-compra/grupos-compra.module';
import { SolicitudesLoteModule } from './solicitudes-lote/solicitudes-lote.module';
import { MensajesModule } from './mensajes/mensajes.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsuariosModule,
    CategoriasModule,
    LotesModule,
    ImagenesLoteModule,
    FavoritosModule,
    PedidosModule,
    GruposCompraModule,
    SolicitudesLoteModule,
    MensajesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
