// Case Types
export type CaseType = "dog_bites" | "mva" | "slip_and_fall";

// Severity Levels
export type Severity = "low" | "medium" | "high";

// Evidence
export type Evidence = {
  id?: string;
  type?: string;
  description?: string;
  url?: string;
};

// Liability
export type Liability = {
  content: string;
  hasPoliceReport: boolean;
  evidence?: Evidence[];
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
