import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database tables...');
  
  // Clear tables in reverse dependency order
  await prisma.doctorNote.deleteMany();
  await prisma.ticketMessage.deleteMany();
  await prisma.ticketHistory.deleteMany();
  await prisma.aiPrediction.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.ticketTag.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.moderator.deleteMany();
  await prisma.session.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding initial system roles and permissions...');
  
  // Create system users
  const passwordHash = await argon2.hash('password123');

  // 1. Create Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@medidesk.com',
      passwordHash,
      role: 'ADMIN',
    },
  });

  // 2. Create Moderator
  const modUser = await prisma.user.create({
    data: {
      email: 'moderator@medidesk.com',
      passwordHash,
      role: 'MODERATOR',
    },
  });
  const moderator = await prisma.moderator.create({
    data: {
      userId: modUser.id,
      name: 'Bob Johnson',
    },
  });

  // 3. Create Doctors
  const doc1User = await prisma.user.create({
    data: {
      email: 'sarah.jenkins@medidesk.com',
      passwordHash,
      role: 'DOCTOR',
    },
  });
  const doctor1 = await prisma.doctor.create({
    data: {
      userId: doc1User.id,
      name: 'Dr. Sarah Jenkins',
      specialization: 'Cardiology',
    },
  });

  const doc2User = await prisma.user.create({
    data: {
      email: 'michael.chen@medidesk.com',
      passwordHash,
      role: 'DOCTOR',
    },
  });
  const doctor2 = await prisma.doctor.create({
    data: {
      userId: doc2User.id,
      name: 'Dr. Michael Chen',
      specialization: 'Orthopedics',
    },
  });

  const doc3User = await prisma.user.create({
    data: {
      email: 'elena.rostova@medidesk.com',
      passwordHash,
      role: 'DOCTOR',
    },
  });
  const doctor3 = await prisma.doctor.create({
    data: {
      userId: doc3User.id,
      name: 'Dr. Elena Rostova',
      specialization: 'Neurology',
    },
  });

  const doc4User = await prisma.user.create({
    data: {
      email: 'david.kim@medidesk.com',
      passwordHash,
      role: 'DOCTOR',
    },
  });
  const doctor4 = await prisma.doctor.create({
    data: {
      userId: doc4User.id,
      name: 'Dr. David Kim',
      specialization: 'General Medicine',
    },
  });

  // 4. Create Patients
  const pat1User = await prisma.user.create({
    data: {
      email: 'patient@medidesk.com',
      passwordHash,
      role: 'PATIENT',
    },
  });
  const patient1 = await prisma.patient.create({
    data: {
      userId: pat1User.id,
      name: 'Alice Watson',
      age: 34,
      gender: 'Female',
      medicalHistory: 'Mild hypertension, allergic to penicillin',
    },
  });

  const pat2User = await prisma.user.create({
    data: {
      email: 'patient.charlie@gmail.com',
      passwordHash,
      role: 'PATIENT',
    },
  });
  const patient2 = await prisma.patient.create({
    data: {
      userId: pat2User.id,
      name: 'Charlie Brown',
      age: 22,
      gender: 'Male',
      medicalHistory: 'No chronic diseases',
    },
  });

  // Create a suspended patient for demonstrating admin moderation
  const suspendedUser = await prisma.user.create({
    data: {
      email: 'abusive.spammer@gmail.com',
      passwordHash,
      role: 'PATIENT',
      isSuspended: true,
    },
  });
  await prisma.patient.create({
    data: {
      userId: suspendedUser.id,
      name: 'Spam User',
      age: 28,
      gender: 'Other',
      medicalHistory: 'History of multiple spam account bans',
    },
  });

  console.log('Seeding clinical tickets and histories...');

  // Ticket 1: Active Cardiology Ticket (Assigned to Dr. Sarah Jenkins)
  const ticket1 = await prisma.ticket.create({
    data: {
      ticketNumber: 'MD-739104',
      title: 'Chronic chest tightness and breathing difficulty',
      description: 'Over the past three days, I have experienced a tight squeezing pain in the center of my chest, particularly when walking up the stairs. It is accompanied by mild dizziness and shortness of breath. The discomfort lasts for about 10 minutes before fading.',
      status: 'ASSIGNED',
      priority: 'CRITICAL',
      category: 'CARDIOLOGY',
      severity: 'CRITICAL',
      patientId: patient1.id,
      doctorId: doctor1.id,
      moderatorId: moderator.id,
    },
  });

  await prisma.aiPrediction.create({
    data: {
      ticketId: ticket1.id,
      extractedSymptoms: JSON.stringify(['Chest Pain', 'Dizziness', 'Shortness of breath']),
      predictedCategory: 'CARDIOLOGY',
      predictedSeverity: 'CRITICAL',
      suggestedResponse: 'Hello Alice. We have prioritized your chest tightness under Cardiology (Critical priority) for rapid review. Dr. Sarah Jenkins is reviewing your symptoms. Please avoid heavy exertion and seek emergency care if the pain intensifies.',
    },
  });

  await prisma.ticketHistory.createMany({
    data: [
      {
        ticketId: ticket1.id,
        changedBy: pat1User.id,
        action: 'TICKET_CREATED',
        details: JSON.stringify({ message: 'Ticket raised by patient' }),
      },
      {
        ticketId: ticket1.id,
        changedBy: modUser.id,
        action: 'ASSIGNED_DOCTOR',
        details: JSON.stringify({ doctorId: doctor1.id, doctorName: doctor1.name }),
      },
    ],
  });

  await prisma.ticketMessage.createMany({
    data: [
      {
        ticketId: ticket1.id,
        senderId: pat1User.id,
        senderRole: 'PATIENT',
        message: 'Hello, the squeezing chest tightness occurred again this morning. Should I take aspirin?',
      },
      {
        ticketId: ticket1.id,
        senderId: doc1User.id,
        senderRole: 'DOCTOR',
        message: 'Hello Alice, please do not exert yourself. Squeezing chest tightness, especially with shortness of breath and dizziness, requires a clinical evaluation. I am reviewing your case now. If you experience crushing pain radiating to your arm or jaw, please go to the nearest emergency room immediately.',
      },
    ],
  });

  await prisma.doctorNote.create({
    data: {
      ticketId: ticket1.id,
      doctorId: doctor1.id,
      note: 'Patient reports exertional chest tightness. Suspect stable angina, but must rule out acute coronary syndrome. ECG and cardiac enzymes workup requested. Advised patient on strict cardiac precautions.',
      isPrivate: true,
    },
  });

  // Ticket 2: Active Orthopedics Ticket (Assigned to Dr. Michael Chen)
  const ticket2 = await prisma.ticket.create({
    data: {
      ticketNumber: 'MD-203914',
      title: 'Acute knee swelling and locking after soccer match',
      description: 'I twisted my left knee during a soccer match yesterday afternoon. I heard a popping sound, and the joint swelled up within a few hours. This morning, I cannot fully straighten the leg, and the joint feels like it is locking up.',
      status: 'ASSIGNED',
      priority: 'HIGH',
      category: 'ORTHOPEDICS',
      severity: 'HIGH',
      patientId: patient2.id,
      doctorId: doctor2.id,
      moderatorId: moderator.id,
    },
  });

  await prisma.aiPrediction.create({
    data: {
      ticketId: ticket2.id,
      extractedSymptoms: JSON.stringify(['Joint pain', 'Swelling', 'Joint locking deficit']),
      predictedCategory: 'ORTHOPEDICS',
      predictedSeverity: 'HIGH',
      suggestedResponse: 'Hello Charlie. We have logged your knee trauma under Orthopedics (High priority). Dr. Michael Chen is assigned to your case and will evaluate you shortly. Please keep the knee elevated and apply ice.',
    },
  });

  await prisma.ticketHistory.createMany({
    data: [
      {
        ticketId: ticket2.id,
        changedBy: pat2User.id,
        action: 'TICKET_CREATED',
        details: JSON.stringify({ message: 'Ticket raised by patient' }),
      },
      {
        ticketId: ticket2.id,
        changedBy: modUser.id,
        action: 'ASSIGNED_DOCTOR',
        details: JSON.stringify({ doctorId: doctor2.id, doctorName: doctor2.name }),
      },
    ],
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket2.id,
      senderId: pat2User.id,
      senderRole: 'PATIENT',
      message: 'I have iced it all night, but the swelling is still quite bad. I can barely bear weight on it.',
    },
  });

  // Ticket 3: Unassigned Open General Medicine Ticket
  const ticket3 = await prisma.ticket.create({
    data: {
      ticketNumber: 'MD-592014',
      title: 'Mild persistent cough and sore throat',
      description: 'I have had a scratchy sore throat and a dry cough for the last four days. No fever, but I feel slightly fatigued. Over-the-counter cough syrups have not provided much relief.',
      status: 'OPEN',
      priority: 'LOW',
      category: 'GENERAL_MEDICINE',
      severity: 'LOW',
      patientId: patient1.id,
    },
  });

  await prisma.aiPrediction.create({
    data: {
      ticketId: ticket3.id,
      extractedSymptoms: JSON.stringify(['Cough', 'Sore throat', 'Fatigue']),
      predictedCategory: 'GENERAL_MEDICINE',
      predictedSeverity: 'LOW',
      suggestedResponse: 'Hello Alice, your symptoms of mild persistent cough and sore throat are being processed under General Medicine. A moderator will assign a specialist to your case shortly. Rest and stay hydrated.',
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket3.id,
      changedBy: pat1User.id,
      action: 'TICKET_CREATED',
      details: JSON.stringify({ message: 'Ticket raised by patient' }),
    },
  });

  // Ticket 4: Resolved Ticket
  const ticket4 = await prisma.ticket.create({
    data: {
      ticketNumber: 'MD-110294',
      title: 'Itchy skin rash on forearm',
      description: 'Developed an intensely itchy red rash on my left forearm after gardening. It has small raised bumps and blisters.',
      status: 'RESOLVED',
      priority: 'MEDIUM',
      category: 'DERMATOLOGY',
      severity: 'MEDIUM',
      patientId: patient1.id,
      doctorId: doctor4.id, // general practitioner resolved it
      resolvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  });

  await prisma.aiPrediction.create({
    data: {
      ticketId: ticket4.id,
      extractedSymptoms: JSON.stringify(['Skin rash', 'Itching', 'Blistering']),
      predictedCategory: 'DERMATOLOGY',
      predictedSeverity: 'MEDIUM',
      suggestedResponse: 'Hello Alice. Your rash is logged under Dermatology. Please apply hydrocortisone cream if available and avoid scratching.',
    },
  });

  await prisma.ticketMessage.createMany({
    data: [
      {
        ticketId: ticket4.id,
        senderId: pat1User.id,
        senderRole: 'PATIENT',
        message: 'The itching is driving me crazy! Is there anything I can apply?',
      },
      {
        ticketId: ticket4.id,
        senderId: doc4User.id,
        senderRole: 'DOCTOR',
        message: 'This looks like contact dermatitis (possibly poison ivy). You can apply 1% hydrocortisone cream and take an over-the-counter antihistamine like Cetirizine to relieve the itching. I will resolve this ticket, but let me know if it spreads.',
      },
      {
        ticketId: ticket4.id,
        senderId: pat1User.id,
        senderRole: 'PATIENT',
        message: 'Thank you doctor! The cream worked wonders. It is almost gone now.',
      },
    ],
  });

  // Add initial audit logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: 'SYSTEM_BOOTSTRAP',
        resource: 'system',
        changes: JSON.stringify({ message: 'System populated via seed script' }),
      },
      {
        userId: suspendedUser.id,
        action: 'USER_SUSPENDED',
        resource: 'user',
        resourceId: suspendedUser.id,
        changes: JSON.stringify({ reason: 'Spam ticket generation' }),
      },
    ],
  });

  console.log('Database seeding successfully completed.');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
