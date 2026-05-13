import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { CreateUsuarioDto } from './dto/CreateUsuarioDto';
import { UpdateUsuarioLocationDto } from './dto/UpdateUsuarioLocationDto';
import { UpdateUsuarioDto } from './dto/UpdateUsuarioDto';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post('register')
  create(@Body() dto: CreateUsuarioDto) {
    return this.usuariosService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
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
          callback(null, `avatar-${suffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtUser,
  ) {
    const avatar = file ? `/uploads/${file.filename}` : null;
    return this.usuariosService.updateAvatar(user.sub, avatar);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('avatar')
  removeAvatar(@CurrentUser() user: JwtUser) {
    return this.usuariosService.updateAvatar(user.sub, null);
  }

  @UseGuards(JwtAuthGuard)
  @Get('location')
  getLocation(@CurrentUser() user: JwtUser) {
    return this.usuariosService.getLocation(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('location')
  updateLocation(
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateUsuarioLocationDto,
  ) {
    return this.usuariosService.updateLocation(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUsuarioDto) {
    return this.usuariosService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.remove(id);
  }
}
