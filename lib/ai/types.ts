export type Transcript = {
  segments: Array<{
    speaker: number;
    content: string;
  }>;
};

export type ExtractedData = {
  caseType: string;
  clientName?: string | null;
  clientDob?: string | null;
  clientPhone?: string | null;
  clientEmail?: string | null;
  clientAddress?: string | null;
  incidentDate?: string | null;
  incidentLocation?: string | null;
  liability: {
    content: string;
    hasPoliceReport: boolean;
    evidence?: Array<{
      id?: string;
      type?: string;
      description?: string;
      url?: string;
    }>;
  };
  damages: {
    severity: "low" | "medium" | "high";
    indications: Array<{
      description: string;
      severity: "low" | "medium" | "high";
      evidence?: Array<{
        id?: string;
        type?: string;
        description?: string;
        url?: string;
      }>;
    }>;
  };
  coverage: {
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
  };
};
