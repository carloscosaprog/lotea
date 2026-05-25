import { Test, TestingModule } from '@nestjs/testing';
import { GruposCompraService } from './grupos-compra.service';
import { PrismaService } from '../prisma/prisma.service';

describe('GruposCompraService', () => {
  let service: GruposCompraService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GruposCompraService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<GruposCompraService>(GruposCompraService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
