import { Test, TestingModule } from '@nestjs/testing';
import { TicketService } from './ticket.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

describe('TicketService (Integration)', () => {
  let service: TicketService;

  const mockTicket = {
    id: 'ticket-abc-123',
    ticketNumber: 'MD-100001',
    title: 'Chest Pain Episode',
    description: 'I have chest pain and dizziness for 3 days',
    status: 'OPEN',
    priority: 'MEDIUM',
    category: 'CARDIOLOGY',
    severity: 'CRITICAL',
    patientId: 'patient-xyz',
    doctorId: null,
    moderatorId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    resolvedAt: null,
  };

  const mockPrisma = {
    ticket: {
      create: jest.fn(({ data }) => Promise.resolve({ id: 'ticket-abc-123', ...data })),
      findUnique: jest.fn(() => Promise.resolve(mockTicket)),
      findMany: jest.fn(() => Promise.resolve([mockTicket])),
      update: jest.fn((args) => Promise.resolve({ ...mockTicket, ...args.data })),
    },
    patient: {
      findUnique: jest.fn(() =>
        Promise.resolve({ id: 'patient-xyz', userId: 'user-abc', name: 'Alice Watson' })
      ),
    },
    aiPrediction: {
      create: jest.fn(() => Promise.resolve({})),
    },
    ticketHistory: {
      create: jest.fn(() => Promise.resolve({})),
    },
    ticketTag: {
      create: jest.fn(() => Promise.resolve({})),
    },
    user: {
      findUnique: jest.fn(() =>
        Promise.resolve({ id: 'user-abc', role: 'PATIENT' })
      ),
    },
    doctor: {
      findUnique: jest.fn(() =>
        Promise.resolve({ id: 'doctor-xyz', name: 'Dr. Sarah Jenkins' })
      ),
    },
    moderator: {
      findUnique: jest.fn(() => Promise.resolve(null)),
    },
    ticketMessage: {
      create: jest.fn((args) => Promise.resolve({ id: 'msg-1', ...args.data })),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  const mockAiService = {
    analyzeQuery: jest.fn(() =>
      Promise.resolve({
        extractedSymptoms: ['Chest Pain', 'Dizziness'],
        predictedCategory: 'CARDIOLOGY',
        predictedSeverity: 'CRITICAL',
        riskFlags: ['Potential Cardiac Event'],
        suggestedResponse: 'Please seek emergency care.',
        disclaimer: 'Not a diagnosis.',
      })
    ),
    getSimilarTickets: jest.fn(() => Promise.resolve([])),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AiService, useValue: mockAiService },
      ],
    }).compile();

    service = module.get<TicketService>(TicketService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a ticket and trigger AI analysis', async () => {
    const ticket = await service.createTicket('user-abc', {
      title: 'Chest Pain Episode',
      description: 'I have chest pain and dizziness for 3 days',
      category: 'CARDIOLOGY',
      patientName: 'Alice Watson',
      age: 35,
      gender: 'Female',
      symptoms: 'Chest pain, dizziness',
      duration: '3 days',
    });

    expect(mockAiService.analyzeQuery).toHaveBeenCalled();
    expect(ticket).toBeDefined();
  });

  it('should assign a doctor and update status to ASSIGNED', async () => {
    const result = await service.assignTicket('ticket-abc-123', 'doctor-xyz', 'user-mod-1');
    expect(result.doctorId).toBe('doctor-xyz');
    expect(result.status).toBe('ASSIGNED');
  });

  it('should update ticket status to RESOLVED and set resolvedAt', async () => {
    const result = await service.updateStatus('ticket-abc-123', 'RESOLVED', 'user-doctor-1');
    expect(result.status).toBe('RESOLVED');
  });

  it('should add a message to the ticket thread', async () => {
    const msg = await service.addMessage('ticket-abc-123', 'user-abc', 'Hello doctor, pain has worsened');
    expect(msg.message).toBe('Hello doctor, pain has worsened');
  });
});
