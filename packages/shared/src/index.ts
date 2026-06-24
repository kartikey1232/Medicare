import { z } from 'zod';

export const UserRole = {
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  DOCTOR: 'DOCTOR',
  PATIENT: 'PATIENT',
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

export const TicketStatus = {
  OPEN: 'OPEN',
  IN_REVIEW: 'IN_REVIEW',
  ASSIGNED: 'ASSIGNED',
  WAITING_FOR_PATIENT: 'WAITING_FOR_PATIENT',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

export type TicketStatusType = typeof TicketStatus[keyof typeof TicketStatus];

export const TicketPriority = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
} as const;

export type TicketPriorityType = typeof TicketPriority[keyof typeof TicketPriority];

export const MedicalCategory = {
  DERMATOLOGY: 'DERMATOLOGY',
  ORTHOPEDICS: 'ORTHOPEDICS',
  PSYCHIATRY: 'PSYCHIATRY',
  CARDIOLOGY: 'CARDIOLOGY',
  PEDIATRICS: 'PEDIATRICS',
  NEUROLOGY: 'NEUROLOGY',
  GENERAL_MEDICINE: 'GENERAL_MEDICINE',
} as const;

export type MedicalCategoryType = typeof MedicalCategory[keyof typeof MedicalCategory];

// Zod schemas for request validation
export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  role: z.enum(['PATIENT', 'DOCTOR', 'MODERATOR', 'ADMIN']).default('PATIENT'),
  // Profile info based on role
  name: z.string().min(2, 'Name is required'),
  age: z.number().int().min(0, 'Age must be positive').optional(),
  gender: z.string().optional(),
  medicalHistory: z.string().optional(),
  specialization: z.string().optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string(),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const CreateTicketSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long'),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  category: z.enum([
    'DERMATOLOGY',
    'ORTHOPEDICS',
    'PSYCHIATRY',
    'CARDIOLOGY',
    'PEDIATRICS',
    'NEUROLOGY',
    'GENERAL_MEDICINE',
  ]),
  patientName: z.string().min(2, 'Patient name is required'),
  age: z.number().int().min(0),
  gender: z.string().min(1, 'Gender is required'),
  symptoms: z.string().min(2, 'Symptoms details are required'),
  duration: z.string().min(1, 'Duration is required'),
  medicalHistory: z.string().optional(),
  attachments: z.array(z.object({
    url: z.string().url(),
    filename: z.string(),
    mimetype: z.string(),
    size: z.number().int(),
  })).optional(),
});

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;

export const MessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  voiceUrl: z.string().url().optional(),
});

export type MessageInput = z.infer<typeof MessageSchema>;
