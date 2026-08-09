import { z } from 'zod';

export const simulationSchema = z.object({
  companySymbol: z.string().min(1, 'Veuillez sélectionner une entreprise'),
  initialAmount: z.number().min(5000, 'Le montant minimum est de 5 000 FCFA').max(500000000, 'Le montant maximum est de 500 000 000 FCFA'),
  period: z.enum(['1M', '3M', '6M', '1Y', '3Y']),
  dividendMode: z.enum(['NONE', 'KEEP', 'REINVEST']),
});

export const loginEmailSchema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

export const registerEmailSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Adresse e-mail invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

export const phoneSchema = z.object({
  phone: z.string().regex(/^\+?[0-9]{8,15}$/, 'Numéro de téléphone invalide (ex: +22507000000)'),
});

export const otpSchema = z.object({
  otp: z.string().length(6, 'Le code OTP contient exactement 6 chiffres'),
});

export const adminCompanyUpdateSchema = z.object({
  symbol: z.string().min(2),
  name: z.string().min(2),
  sector: z.string().min(2),
  currentPrice: z.number().positive(),
  eps: z.number().optional(),
  lastDividend: z.number().optional(),
});
