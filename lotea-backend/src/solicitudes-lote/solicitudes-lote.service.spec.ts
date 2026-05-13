import { Test, TestingModule } from '@nestjs/testing';
import { SolicitudesLoteService } from './solicitudes-lote.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SolicitudesLoteService', () => {
  let service: SolicitudesLoteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SolicitudesLoteService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<SolicitudesLoteService>(SolicitudesLoteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
