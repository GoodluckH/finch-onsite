// Case Types
export type CaseType = "dog_bites" | "mva" | "slip_and_fall";

// Severity Levels
export type Severity = "low" | "medium" | "high";

// At-Fault determination
export type AtFault = "client" | "other_party" | "shared" | "unclear";

// Evidence
export type Evidence = {
  id?: string;
  type?: string;
  description?: string;
  url?: string;
};

// Fault Percentages (for shared fault cases)
export type FaultPercentages = {
  client: number; // 0-100
  otherParty: number; // 0-100
};

// Citation (references to turn IDs)
export type Citation = {
  field: string;
  turnIds: number[];
};

// Liability
export type Liability = {
  atFault: AtFault;
  faultPercentages?: FaultPercentages;
  rationale: string; // Markdown bulleted list justifying fault
  hasPoliceReport: boolean;
  evidence?: Evidence[];
  citations?: Citation[];
};

// Indication (nested in Damages)
export type Indication = {
  description: string;
  severity: Severity;
  evidence?: Evidence[];
};

// Damages
export type Damages = {
  severity: Severity;
  indications: Indication[];
  citations?: Citation[];
};

// Coverage (Insurance Information)
export type Coverage = {
  clientHasInsurance: boolean | null;
  clientInsuranceProvider?: string;
  clientPolicyNumber?: string;
  clientCoverageEffectiveDate?: string;
  clientCoverageExpirationDate?: string;
  clientCoverageDetails?: string;

  otherPartyHasInsurance: boolean | null;
  otherPartyInsuranceProvider?: string;
  otherPartyPolicyNumber?: string;
  otherPartyCoverageEffectiveDate?: string;
  otherPartyCoverageExpirationDate?: string;
  otherPartyCoverageDetails?: string;

  medicalCoverageAvailable: boolean | null;
  medicalCoverageDetails?: string;

  underinsuredMotoristCoverage: boolean | null;
  policyLimits?: string;

  notes?: string;
  citations?: Citation[];
};

// Intake Form Data
export type IntakeFormData = {
  id: number;
  caseType: CaseType;
  liability: Liability;
  damages: Damages;
  coverage: Coverage;
};

// Matter
export type Matter = {
  id: number;
  name: string;
  clientName?: string | null;
  clientDob?: string | null;
  clientPhone?: string | null;
  clientEmail?: string | null;
  clientAddress?: string | null;
  incidentDate?: string | null;
  incidentLocation?: string | null;
  brief?: string | null; // AI-generated case summary
  createdAt: Date;
  updatedAt: Date;
  intakeFormDataId: number;
};

// Matter with related intake form data
export type MatterWithIntakeForm = Matter & {
  intakeFormData: IntakeFormData;
};

// Create inputs (without IDs and timestamps)
export type CreateIntakeFormData = {
  caseType: CaseType;
  liability: Liability;
  damages: Damages;
  coverage: Coverage;
};

export type CreateMatter = {
  name: string;
  intakeFormData: CreateIntakeFormData;
  clientName?: string;
  clientDob?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  incidentDate?: string;
  incidentLocation?: string;
};
