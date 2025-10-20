import { z } from "zod";

/**
 * Citation schemas for tracking which transcript turns contributed to extracted data
 */

// Array of turn IDs
const TurnIDArraySchema = z.array(z.number()).optional();

// Liability citations
export const LiabilityCitationsSchema = z.object({
  content: TurnIDArraySchema,
  hasPoliceReport: TurnIDArraySchema,
}).optional();

// Damages citations
export const DamagesCitationsSchema = z.object({
  severity: TurnIDArraySchema,
}).optional();

// Indication-level citations (stored per indication)
export const IndicationCitationsSchema = TurnIDArraySchema;

// Coverage citations
export const CoverageCitationsSchema = z.object({
  clientHasInsurance: TurnIDArraySchema,
  clientInsuranceProvider: TurnIDArraySchema,
  clientPolicyNumber: TurnIDArraySchema,
  clientCoverageEffectiveDate: TurnIDArraySchema,
  clientCoverageExpirationDate: TurnIDArraySchema,
  clientCoverageDetails: TurnIDArraySchema,
  otherPartyHasInsurance: TurnIDArraySchema,
  otherPartyInsuranceProvider: TurnIDArraySchema,
  otherPartyPolicyNumber: TurnIDArraySchema,
  otherPartyCoverageEffectiveDate: TurnIDArraySchema,
  otherPartyCoverageExpirationDate: TurnIDArraySchema,
  otherPartyCoverageDetails: TurnIDArraySchema,
  medicalCoverageAvailable: TurnIDArraySchema,
  medicalCoverageDetails: TurnIDArraySchema,
  underinsuredMotoristCoverage: TurnIDArraySchema,
  policyLimits: TurnIDArraySchema,
  notes: TurnIDArraySchema,
}).optional();

// Client info citations (stored on matter.citations)
export const ClientInfoCitationsSchema = z.object({
  caseType: TurnIDArraySchema,
  clientName: TurnIDArraySchema,
  clientDob: TurnIDArraySchema,
  clientPhone: TurnIDArraySchema,
  clientEmail: TurnIDArraySchema,
  clientAddress: TurnIDArraySchema,
  incidentDate: TurnIDArraySchema,
  incidentLocation: TurnIDArraySchema,
}).optional();

// Type exports
export type LiabilityCitations = z.infer<typeof LiabilityCitationsSchema>;
export type DamagesCitations = z.infer<typeof DamagesCitationsSchema>;
export type CoverageCitations = z.infer<typeof CoverageCitationsSchema>;
export type ClientInfoCitations = z.infer<typeof ClientInfoCitationsSchema>;

/**
 * Extended types that include citations
 * These are what we'll store in the database
 */
export type LiabilityWithCitations = {
  content: string;
  hasPoliceReport: boolean;
  evidence?: any[];
  citations?: LiabilityCitations;
};

export type IndicationWithCitations = {
  description: string;
  severity: "low" | "medium" | "high";
  evidence?: any[];
  citations?: number[]; // Turn IDs
};

export type DamagesWithCitations = {
  severity: "low" | "medium" | "high";
  indications: IndicationWithCitations[];
  citations?: DamagesCitations;
};

export type CoverageWithCitations = {
  clientHasInsurance: boolean | null;
  clientInsuranceProvider?: string | null;
  clientPolicyNumber?: string | null;
  clientCoverageEffectiveDate?: string | null;
  clientCoverageExpirationDate?: string | null;
  clientCoverageDetails?: string | null;
  otherPartyHasInsurance: boolean | null;
  otherPartyInsuranceProvider?: string | null;
  otherPartyPolicyNumber?: string | null;
  otherPartyCoverageEffectiveDate?: string | null;
  otherPartyCoverageExpirationDate?: string | null;
  otherPartyCoverageDetails?: string | null;
  medicalCoverageAvailable: boolean | null;
  medicalCoverageDetails?: string | null;
  underinsuredMotoristCoverage: boolean | null;
  policyLimits?: string | null;
  notes?: string | null;
  citations?: CoverageCitations;
};
