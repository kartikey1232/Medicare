import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AiService', () => {
  let service: AiService;

  const mockPrisma = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should extract chest pain and classify to Cardiology', async () => {
    const res = await service.analyzeQuery('I have chest pain and dizziness');
    expect(res.predictedCategory).toBe('CARDIOLOGY');
    expect(res.predictedSeverity).toBe('CRITICAL');
    expect(res.extractedSymptoms).toContain('Chest Pain');
  });

  it('should extract skin problems and classify to Dermatology', async () => {
    const res = await service.analyzeQuery('I have a severe red rash on my arm');
    expect(res.predictedCategory).toBe('DERMATOLOGY');
    expect(res.predictedSeverity).toBe('MEDIUM');
  });
});
