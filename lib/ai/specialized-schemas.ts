import { z } from "zod";

// Client basic information schema
export const ClientInfoSchema = z.object({
  caseType: z.enum(["dog_bites", "mva", "slip_and_fall"]),
  clientName: z.string().nullable().optional(),
  clientDob: z.string().nullable().optional(),
  clientPhone: z.string().nullable().optional(),
  clientEmail: z.string().nullable().optional(),
  clientAddress: z.string().nullable().optional(),
  incidentDate: z.string().nullable().optional(),
  incidentLocation: z.string().nullable().optional(),
});

// Liability schema
const EvidenceSchema = z
  .object({
    id: z.string().optional(),
    type: z.string().optional(),
    description: z.string().optional(),
    url: z.string().optional(),
  })
  .optional();

export const LiabilitySchema = z.object({
  content: z.string(),
  hasPoliceReport: z.boolean(),
  evidence: z.array(EvidenceSchema).optional(),
});

// Damages schema
const IndicationSchema = z.object({
  description: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  evidence: z.array(EvidenceSchema).optional(),
});

export const DamagesSchema = z.object({
  severity: z.enum(["low", "medium", "high"]),
  indications: z.array(IndicationSchema),
});

// Coverage schema
export const CoverageSchema = z.object({
  clientHasInsurance: z.boolean().nullable(),
  clientInsuranceProvider: z.string().nullable().optional(),
  clientPolicyNumber: z.string().nullable().optional(),
  clientCoverageEffectiveDate: z.string().nullable().optional(),
  clientCoverageExpirationDate: z.string().nullable().optional(),
  clientCoverageDetails: z.string().nullable().optional(),

  otherPartyHasInsurance: z.boolean().nullable(),
  otherPartyInsuranceProvider: z.string().nullable().optional(),
  otherPartyPolicyNumber: z.string().nullable().optional(),
  otherPartyCoverageEffectiveDate: z.string().nullable().optional(),
  otherPartyCoverageExpirationDate: z.string().nullable().optional(),
  otherPartyCoverageDetails: z.string().nullable().optional(),

  medicalCoverageAvailable: z.boolean().nullable(),
  medicalCoverageDetails: z.string().nullable().optional(),

  underinsuredMotoristCoverage: z.boolean().nullable(),
  policyLimits: z.string().nullable().optional(),

  notes: z.string().nullable().optional(),
});

export type ClientInfo = z.infer<typeof ClientInfoSchema>;
export type Liability = z.infer<typeof LiabilitySchema>;
export type Damages = z.infer<typeof DamagesSchema>;
export type Coverage = z.infer<typeof CoverageSchema>;
