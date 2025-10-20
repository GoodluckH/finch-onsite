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

// Intake Form Data
export type IntakeFormData = {
  id: number;
  caseType: CaseType;
  liability: Liability;
  damages: Damages;
};

// Matter
export type Matter = {
  id: number;
  name: string;
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
};

export type CreateMatter = {
  name: string;
  intakeFormData: CreateIntakeFormData;
};
