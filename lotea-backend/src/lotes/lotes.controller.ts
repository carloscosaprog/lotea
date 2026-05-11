import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { existsSync, mkdirSync } from "fs";
import { extname, join } from "path";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { JwtUser } from "../auth/interfaces/jwt-user.interface";
import { CreateLoteDto } from "./dto/CreateLoteDto";
import { UpdateLoteDto } from "./dto/UpdateLoteDto";
import { LotesService } from "./lotes.service";

@Controller("lotes")
export class LotesController {
  constructor(private readonly lotesService: LotesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FilesInterceptor("imagenesFiles", 10, {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          const uploadPath = join(process.cwd(), "uploads");

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
  create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: CreateLoteDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.lotesService.create(dto, user.sub, files);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.lotesService.findAll(user.sub);
  }

  @Get("vendedor/:id")
  findByVendedor(@Param("id", ParseIntPipe) id: number) {
    return this.lotesService.findByVendedor(id);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.lotesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateLoteDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.lotesService.update(id, dto, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.lotesService.remove(id, user.sub);
  }
}
