import type { Extraction } from "./schema";

/**
 * Merge liability content from multiple extractions
 */
function mergeLiabilityContent(
  contents: string[],
  hasPoliceReports: boolean[]
): { content: string; hasPoliceReport: boolean } {
  console.log(`[Merger] Merging ${contents.length} liability contents`);

  // Combine all content, remove duplicates
  const allPoints = contents
    .flatMap((content) =>
      content
        .split("\n")
        .filter((line) => line.trim().startsWith("-") || line.trim().startsWith("*"))
    )
    .map((line) => line.trim());

  // Deduplicate based on similarity (simple exact match for now)
  const uniquePoints = [...new Set(allPoints)];

  console.log(
    `[Merger] Combined ${allPoints.length} points into ${uniquePoints.length} unique points`
  );

  // Any chunk mentioning police report = has police report
  const hasPoliceReport = hasPoliceReports.some((val) => val === true);
  console.log(`[Merger] Has police report: ${hasPoliceReport}`);

  return {
    content: uniquePoints.join("\n"),
    hasPoliceReport,
  };
}

/**
 * Deduplicate indications based on description similarity
 */
function deduplicateIndications(
  indications: Array<{ description: string; severity: "low" | "medium" | "high" }>
): Array<{ description: string; severity: "low" | "medium" | "high" }> {
  console.log(`[Merger] Deduplicating ${indications.length} indications`);

  const seen = new Set<string>();
  const unique = indications.filter((indication) => {
    const key = indication.description.toLowerCase().trim();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  console.log(`[Merger] ${unique.length} unique indications after deduplication`);
  return unique;
}

/**
 * Merge coverage data from multiple extractions
 * Strategy: Use non-null values, prefer later chunks for conflicts
 */
function mergeCoverage(
  coverages: Extraction["coverage"][]
): Extraction["coverage"] {
  console.log(`[Merger] Merging ${coverages.length} coverage objects`);

  const merged = coverages.reduce((acc, curr) => ({
    clientHasInsurance: curr.clientHasInsurance ?? acc.clientHasInsurance,
    clientInsuranceProvider:
      curr.clientInsuranceProvider ?? acc.clientInsuranceProvider,
    clientPolicyNumber: curr.clientPolicyNumber ?? acc.clientPolicyNumber,
    clientCoverageEffectiveDate:
      curr.clientCoverageEffectiveDate ?? acc.clientCoverageEffectiveDate,
    clientCoverageExpirationDate:
      curr.clientCoverageExpirationDate ?? acc.clientCoverageExpirationDate,
    clientCoverageDetails:
      curr.clientCoverageDetails ?? acc.clientCoverageDetails,

    otherPartyHasInsurance:
      curr.otherPartyHasInsurance ?? acc.otherPartyHasInsurance,
    otherPartyInsuranceProvider:
      curr.otherPartyInsuranceProvider ?? acc.otherPartyInsuranceProvider,
    otherPartyPolicyNumber:
      curr.otherPartyPolicyNumber ?? acc.otherPartyPolicyNumber,
    otherPartyCoverageEffectiveDate:
      curr.otherPartyCoverageEffectiveDate ??
      acc.otherPartyCoverageEffectiveDate,
    otherPartyCoverageExpirationDate:
      curr.otherPartyCoverageExpirationDate ??
      acc.otherPartyCoverageExpirationDate,
    otherPartyCoverageDetails:
      curr.otherPartyCoverageDetails ?? acc.otherPartyCoverageDetails,

    medicalCoverageAvailable:
      curr.medicalCoverageAvailable ?? acc.medicalCoverageAvailable,
    medicalCoverageDetails:
      curr.medicalCoverageDetails ?? acc.medicalCoverageDetails,

    underinsuredMotoristCoverage:
      curr.underinsuredMotoristCoverage ?? acc.underinsuredMotoristCoverage,
    policyLimits: curr.policyLimits ?? acc.policyLimits,

    notes: curr.notes ?? acc.notes,
  }));

  return merged;
}

/**
 * Merge multiple extraction results into a single result
 * Strategy: Prefer later chunks for scalar values, merge arrays
 */
export function mergeExtractions(extractions: Extraction[]): Extraction {
  console.log(`\n=== Merging ${extractions.length} Extractions ===`);

  if (extractions.length === 0) {
    throw new Error("No extractions to merge");
  }

  if (extractions.length === 1) {
    console.log("Only one extraction, returning as-is");
    console.log("=== Merge Complete ===\n");
    return extractions[0];
  }

  // Get case type (prefer non-null from later chunks)
  const caseType =
    extractions.reverse().find((e) => e.caseType)?.caseType || "mva";
  console.log(`[Merger] Case type: ${caseType}`);

  // Get client info (prefer later chunks for conflicts)
  const clientName =
    extractions.find((e) => e.clientName)?.clientName || null;
  const clientDob = extractions.find((e) => e.clientDob)?.clientDob || null;
  const clientPhone =
    extractions.find((e) => e.clientPhone)?.clientPhone || null;
  const clientEmail =
    extractions.find((e) => e.clientEmail)?.clientEmail || null;
  const clientAddress =
    extractions.find((e) => e.clientAddress)?.clientAddress || null;
  const incidentDate =
    extractions.find((e) => e.incidentDate)?.incidentDate || null;
  const incidentLocation =
    extractions.find((e) => e.incidentLocation)?.incidentLocation || null;

  console.log(`[Merger] Client name: ${clientName || "N/A"}`);
  console.log(`[Merger] Incident date: ${incidentDate || "N/A"}`);

  // Merge liability
  const liability = mergeLiabilityContent(
    extractions.map((e) => e.liability.content),
    extractions.map((e) => e.liability.hasPoliceReport)
  );

  // Get severity (prefer later chunks, prefer higher severity)
  const severityOrder = { low: 1, medium: 2, high: 3 };
  const damages = {
    severity: extractions.reduce((max, e) =>
      severityOrder[e.damages.severity] > severityOrder[max]
        ? e.damages.severity
        : max
    , "low" as "low" | "medium" | "high"),
    indications: deduplicateIndications(
      extractions.flatMap((e) => e.damages.indications)
    ),
  };

  console.log(`[Merger] Damages severity: ${damages.severity}`);
  console.log(`[Merger] Total indications: ${damages.indications.length}`);

  // Merge coverage
  const coverage = mergeCoverage(extractions.map((e) => e.coverage));

  const merged: Extraction = {
    caseType,
    clientName,
    clientDob,
    clientPhone,
    clientEmail,
    clientAddress,
    incidentDate,
    incidentLocation,
    liability,
    damages,
    coverage,
  };

  console.log("=== Merge Complete ===\n");

  return merged;
}
