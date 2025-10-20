import type { ChunkExtraction } from "./specialized-extractor";
import type { ClientInfo, Liability, Damages, Coverage } from "./specialized-schemas";

/**
 * Merge client info from multiple chunks
 */
function mergeClientInfo(infos: ClientInfo[]): ClientInfo {
  console.log(`[Merger] Merging ${infos.length} client info objects`);

  // Use first non-null value found (prefer later chunks for conflicts)
  const reversed = [...infos].reverse();

  const merged: ClientInfo = {
    caseType: reversed.find((i) => i.caseType)?.caseType || "mva",
    clientName: reversed.find((i) => i.clientName)?.clientName || null,
    clientDob: reversed.find((i) => i.clientDob)?.clientDob || null,
    clientPhone: reversed.find((i) => i.clientPhone)?.clientPhone || null,
    clientEmail: reversed.find((i) => i.clientEmail)?.clientEmail || null,
    clientAddress: reversed.find((i) => i.clientAddress)?.clientAddress || null,
    incidentDate: reversed.find((i) => i.incidentDate)?.incidentDate || null,
    incidentLocation:
      reversed.find((i) => i.incidentLocation)?.incidentLocation || null,
  };

  console.log(`[Merger] Client: ${merged.clientName || "N/A"}, Case: ${merged.caseType}`);
  return merged;
}

/**
 * Merge liability from multiple chunks
 */
function mergeLiability(liabilities: Liability[]): Liability {
  console.log(`[Merger] Merging ${liabilities.length} liability objects`);

  // Combine all bullet points from rationale
  const allPoints = liabilities
    .flatMap((l) =>
      l.rationale
        .split("\n")
        .filter((line: string) => line.trim().startsWith("-") || line.trim().startsWith("*"))
    )
    .map((line: string) => line.trim());

  // Deduplicate
  const uniquePoints = [...new Set(allPoints)];

  console.log(
    `[Merger] Combined ${allPoints.length} liability points into ${uniquePoints.length} unique`
  );

  // Any mention of police report = true
  const hasPoliceReport = liabilities.some((l) => l.hasPoliceReport);

  // Use the most specific fault determination (prefer non-unclear values)
  const faultDeterminations = liabilities.map((l) => l.atFault);
  const atFault =
    faultDeterminations.find((f) => f !== "unclear") || "unclear";

  // If shared fault, average the percentages
  let faultPercentages: { client: number; otherParty: number } | undefined;
  if (atFault === "shared") {
    const sharedLiabilities = liabilities.filter(
      (l) => l.atFault === "shared" && l.faultPercentages
    );
    if (sharedLiabilities.length > 0) {
      const avgClient =
        sharedLiabilities.reduce(
          (sum, l) => sum + (l.faultPercentages?.client || 0),
          0
        ) / sharedLiabilities.length;
      const avgOtherParty =
        sharedLiabilities.reduce(
          (sum, l) => sum + (l.faultPercentages?.otherParty || 0),
          0
        ) / sharedLiabilities.length;
      faultPercentages = {
        client: Math.round(avgClient),
        otherParty: Math.round(avgOtherParty),
      };
    }
  }

  return {
    atFault,
    faultPercentages,
    rationale: uniquePoints.join("\n"),
    hasPoliceReport,
    evidence: [],
  };
}

/**
 * Merge damages from multiple chunks
 */
function mergeDamages(damages: Damages[]): Damages {
  console.log(`[Merger] Merging ${damages.length} damages objects`);

  // Use highest severity
  const severityOrder = { low: 1, medium: 2, high: 3 };
  const severity = damages.reduce(
    (max, d) =>
      severityOrder[d.severity] > severityOrder[max] ? d.severity : max,
    "low" as "low" | "medium" | "high"
  );

  // Combine and deduplicate indications
  const allIndications = damages.flatMap((d) => d.indications);
  const seen = new Set<string>();
  const uniqueIndications = allIndications.filter((indication) => {
    const key = indication.description.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(
    `[Merger] Severity: ${severity}, Indications: ${uniqueIndications.length}`
  );

  return {
    severity,
    indications: uniqueIndications,
  };
}

/**
 * Merge coverage from multiple chunks
 */
function mergeCoverage(coverages: Coverage[]): Coverage {
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
 * Merge multiple chunk extractions into final result
 */
export function mergeChunkExtractions(
  extractions: ChunkExtraction[]
): ChunkExtraction {
  console.log(`\n=== Merging ${extractions.length} Chunk Extractions ===`);

  if (extractions.length === 0) {
    throw new Error("No extractions to merge");
  }

  if (extractions.length === 1) {
    console.log("Only one extraction, returning as-is");
    console.log("=== Merge Complete ===\n");
    return extractions[0];
  }

  const merged: ChunkExtraction = {
    clientInfo: mergeClientInfo(extractions.map((e) => e.clientInfo)),
    liability: mergeLiability(extractions.map((e) => e.liability)),
    damages: mergeDamages(extractions.map((e) => e.damages)),
    coverage: mergeCoverage(extractions.map((e) => e.coverage)),
  };

  console.log("=== Merge Complete ===\n");
  return merged;
}
