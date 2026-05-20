import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
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
  @Post('lote/:id/upload')
  @UseInterceptors(
    FilesInterceptor('imagenesFiles', 10, {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          const uploadPath = join(process.cwd(), 'uploads');

          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }

          callback(null, uploadPath);
        },
        filename: (_req, file, callback) => {
          const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          callback(null, `${suffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadByLote(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: JwtUser,
  ) {
    return this.imagenesLoteService.addUploadedImages(id, user.sub, files);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.imagenesLoteService.remove(id, user.sub);
  }
}
