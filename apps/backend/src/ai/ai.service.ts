import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  async analyzeQuery(text: string) {
    const lowerText = text.toLowerCase();
    const extractedSymptoms: string[] = [];
    let predictedCategory = 'GENERAL_MEDICINE';
    let predictedSeverity = 'LOW';
    let riskFlags: string[] = [];

    // Triage rule matcher
    if (lowerText.includes('chest pain') || lowerText.includes('dizziness') || lowerText.includes('heart') || lowerText.includes('breath')) {
      extractedSymptoms.push('Chest Pain', 'Dizziness');
      predictedCategory = 'CARDIOLOGY';
      predictedSeverity = 'CRITICAL';
      riskFlags.push('Potential Cardiac Event', 'High Risk of Ischemia');
    } else if (lowerText.includes('bone') || lowerText.includes('fracture') || lowerText.includes('joint') || lowerText.includes('back pain')) {
      extractedSymptoms.push('Skeletal Pain', 'Mobility difficulty');
      predictedCategory = 'ORTHOPEDICS';
      predictedSeverity = 'HIGH';
      riskFlags.push('Fracture susceptibility');
    } else if (lowerText.includes('depressed') || lowerText.includes('anxious') || lowerText.includes('suicid') || lowerText.includes('panic')) {
      extractedSymptoms.push('Anxiety', 'Depressive symptoms');
      predictedCategory = 'PSYCHIATRY';
      predictedSeverity = lowerText.includes('suicid') ? 'CRITICAL' : 'MEDIUM';
      riskFlags.push('Mental health crisis evaluation needed');
    } else if (lowerText.includes('rash') || lowerText.includes('skin') || lowerText.includes('itch') || lowerText.includes('mole')) {
      extractedSymptoms.push('Skin irritation', 'Lesion');
      predictedCategory = 'DERMATOLOGY';
      predictedSeverity = 'MEDIUM';
    } else if (lowerText.includes('child') || lowerText.includes('pediatric') || lowerText.includes('baby') || lowerText.includes('kid')) {
      extractedSymptoms.push('Pediatric ailment');
      predictedCategory = 'PEDIATRICS';
      predictedSeverity = 'MEDIUM';
    } else if (lowerText.includes('seizure') || lowerText.includes('numb') || lowerText.includes('stroke') || lowerText.includes('migraine')) {
      extractedSymptoms.push('Neurological deficit', 'Severe headache');
      predictedCategory = 'NEUROLOGY';
      predictedSeverity = 'HIGH';
      riskFlags.push('Neurological emergency exclusion required');
    } else {
      extractedSymptoms.push('General discomfort');
      predictedCategory = 'GENERAL_MEDICINE';
      predictedSeverity = 'LOW';
    }

    const disclaimer = 'CRITICAL DISCLAIMER: This is an AI-assisted triage assessment. It is NOT a medical diagnosis, does not contain final clinical decisions, and must be reviewed and confirmed by a licensed medical professional before showing any clinical recommendation to the patient.';

    // Generate suggested doctor responses
    const suggestedResponse = `Hello. Thank you for reaching out. Based on your symptoms: ${extractedSymptoms.join(', ')}, we have logged your case under ${predictedCategory} (${predictedSeverity} priority) for rapid doctor evaluation. A clinician will review this shortly.`;

    return {
      extractedSymptoms,
      predictedCategory,
      predictedSeverity,
      riskFlags,
      suggestedResponse,
      disclaimer,
    };
  }

  async getSimilarTickets(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return [];

    // Return mock vector database matched tickets in same category
    const similar = await this.prisma.ticket.findMany({
      where: {
        category: ticket.category,
        id: { not: ticketId },
      },
      take: 3,
      include: {
        patient: true,
      },
    });

    return similar.map(t => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      title: t.title,
      status: t.status,
      severity: t.severity,
      similarityScore: 0.85,
    }));
  }
}
