import { Test, TestingModule } from '@nestjs/testing';
import { MensajesService } from './mensajes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MensajesService', () => {
  let service: MensajesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MensajesService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<MensajesService>(MensajesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
