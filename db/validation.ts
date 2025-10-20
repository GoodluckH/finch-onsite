import { z } from "zod";

// Enums
export const CaseTypeEnum = z.enum(["dog_bites", "mva", "slip_and_fall"]);
export type CaseType = z.infer<typeof CaseTypeEnum>;

export const SeverityEnum = z.enum(["low", "medium", "high"]);
export type Severity = z.infer<typeof SeverityEnum>;

// Evidence schema (shared between liability and damages)
export const EvidenceSchema = z.object({
  id: z.string().optional(),
  type: z.string().optional(),
  description: z.string().optional(),
  url: z.string().optional(),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

// Liability schema
export const LiabilitySchema = z.object({
  content: z.string(),
  hasPoliceReport: z.boolean(),
  evidence: z.array(EvidenceSchema).optional(),
});
export type Liability = z.infer<typeof LiabilitySchema>;

// Indication schema (nested in damages)
export const IndicationSchema = z.object({
  description: z.string(),
  severity: SeverityEnum,
  evidence: z.array(EvidenceSchema).optional(),
});
export type Indication = z.infer<typeof IndicationSchema>;

// Damages schema
export const DamagesSchema = z.object({
  severity: SeverityEnum,
  indications: z.array(IndicationSchema),
});
export type Damages = z.infer<typeof DamagesSchema>;

// Intake form data schema
export const IntakeFormDataSchema = z.object({
  caseType: CaseTypeEnum,
  liability: LiabilitySchema,
  damages: DamagesSchema,
});
export type IntakeFormDataInput = z.infer<typeof IntakeFormDataSchema>;

// Matter schema (for creation)
export const MatterCreateSchema = z.object({
  name: z.string().min(1, "Matter name is required"),
  intakeFormData: IntakeFormDataSchema,
});
export type MatterCreateInput = z.infer<typeof MatterCreateSchema>;
