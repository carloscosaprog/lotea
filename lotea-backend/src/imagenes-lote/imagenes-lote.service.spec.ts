import { Test, TestingModule } from '@nestjs/testing';
import { ImagenesLoteService } from './imagenes-lote.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ImagenesLoteService', () => {
  let service: ImagenesLoteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImagenesLoteService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<ImagenesLoteService>(ImagenesLoteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
