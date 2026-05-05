import { Test, TestingModule } from '@nestjs/testing';
import { LotesService } from './lotes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LotesService', () => {
  let service: LotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LotesService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<LotesService>(LotesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
