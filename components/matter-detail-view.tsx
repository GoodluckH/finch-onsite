"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Liability, Damages, Coverage, Severity } from "@/db/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { updateMatter } from "@/app/actions/matters";
import { updateIntakeFormData } from "@/app/actions/matters";

type Matter = {
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
};

type MatterDetailViewProps = {
  matter: Matter;
  intakeFormDataId: number;
  initialIntakeData: {
    caseType: string;
    liability: Liability;
    damages: Damages;
    coverage: Coverage;
  };
};

export function MatterDetailView({
  matter,
  intakeFormDataId,
  initialIntakeData,
}: MatterDetailViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Matter fields state
  const [clientName, setClientName] = useState(matter.clientName || "");
  const [clientDob, setClientDob] = useState(matter.clientDob || "");
  const [clientPhone, setClientPhone] = useState(matter.clientPhone || "");
  const [clientEmail, setClientEmail] = useState(matter.clientEmail || "");
  const [clientAddress, setClientAddress] = useState(matter.clientAddress || "");
  const [incidentDate, setIncidentDate] = useState(matter.incidentDate || "");
  const [incidentLocation, setIncidentLocation] = useState(matter.incidentLocation || "");

  // Intake form data state
  const [caseType, setCaseType] = useState(initialIntakeData.caseType);
  const [liability, setLiability] = useState(initialIntakeData.liability);
  const [damages, setDamages] = useState(initialIntakeData.damages);
  const [coverage, setCoverage] = useState(initialIntakeData.coverage);

  // Preview mode for liability markdown
  const [liabilityPreview, setLiabilityPreview] = useState(true);

  // Warn on page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (
        !window.confirm(
          "You have unsaved changes. Are you sure you want to cancel?"
        )
      ) {
        return;
      }
    }
    // Reset all fields
    setClientName(matter.clientName || "");
    setClientDob(matter.clientDob || "");
    setClientPhone(matter.clientPhone || "");
    setClientEmail(matter.clientEmail || "");
    setClientAddress(matter.clientAddress || "");
    setIncidentDate(matter.incidentDate || "");
    setIncidentLocation(matter.incidentLocation || "");
    setCaseType(initialIntakeData.caseType);
    setLiability(initialIntakeData.liability);
    setDamages(initialIntakeData.damages);
    setCoverage(initialIntakeData.coverage);
    setIsEditing(false);
    setHasUnsavedChanges(false);
  };

  const handleSave = async () => {
    try {
      // Update matter fields
      await updateMatter(matter.id, {
        clientName,
        clientDob,
        clientPhone,
        clientEmail,
        clientAddress,
        incidentDate,
        incidentLocation,
      });

      // Update intake form data
      await updateIntakeFormData(intakeFormDataId, {
        caseType,
        liability,
        damages,
        coverage,
      });

      setIsEditing(false);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to save changes. Please try again.");
    }
  };

  const markAsChanged = () => {
    if (!hasUnsavedChanges) {
      setHasUnsavedChanges(true);
    }
  };

  // Check if coverage dates are valid for incident
  const getCoverageDateWarning = (
    effectiveDate?: string | null,
    expirationDate?: string | null,
    incidentDateValue?: string | null
  ) => {
    if (!incidentDateValue || !effectiveDate) return null;

    const incident = new Date(incidentDateValue);
    const effective = new Date(effectiveDate);
    const expiration = expirationDate ? new Date(expirationDate) : null;

    if (incident < effective) {
      return "⚠️ Incident occurred before coverage effective date";
    }
    if (expiration && incident > expiration) {
      return "⚠️ Incident occurred after coverage expired";
    }
    return "✓ Coverage valid on incident date";
  };

  const caseTypeDisplay =
    caseType === "dog_bites"
      ? "Dog Bites"
      : caseType === "mva"
        ? "Motor Vehicle Accident"
        : "Slip and Fall";

  const clientCoverageWarning = getCoverageDateWarning(
    coverage.clientCoverageEffectiveDate,
    coverage.clientCoverageExpirationDate,
    incidentDate
  );

  const otherPartyCoverageWarning = getCoverageDateWarning(
    coverage.otherPartyCoverageEffectiveDate,
    coverage.otherPartyCoverageExpirationDate,
    incidentDate
  );

  return (
    <div className="space-y-4" data-unsaved-changes={hasUnsavedChanges}>
      {/* Top Action Bar */}
      <div className="bg-white rounded-md border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">
            {isEditing ? "Editing Matter" : "Matter Details"}
          </h2>
          {hasUnsavedChanges && (
            <span className="text-xs text-orange-600 font-medium">
              (Unsaved changes)
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasUnsavedChanges}
              >
                Save
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Client Information Card */}
      <div className="bg-white rounded-md border">
        <div className="border-b px-4 py-2">
          <h2 className="text-sm font-semibold">Client Information</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-x-6 gap-y-3">
            <EditableField
              label="Name"
              value={clientName}
              onChange={(val) => {
                setClientName(val);
                markAsChanged();
              }}
              isEditing={isEditing}
            />
            <EditableField
              label="Date of Birth"
              value={clientDob}
              onChange={(val) => {
                setClientDob(val);
                markAsChanged();
              }}
              isEditing={isEditing}
              type="date"
            />
            <EditableField
              label="Phone"
              value={clientPhone}
              onChange={(val) => {
                setClientPhone(val);
                markAsChanged();
              }}
              isEditing={isEditing}
            />
            <EditableField
              label="Email"
              value={clientEmail}
              onChange={(val) => {
                setClientEmail(val);
                markAsChanged();
              }}
              isEditing={isEditing}
              type="email"
            />
            <EditableField
              label="Address"
              value={clientAddress}
              onChange={(val) => {
                setClientAddress(val);
                markAsChanged();
              }}
              isEditing={isEditing}
              span={2}
            />
          </div>
        </div>
      </div>

      {/* Incident Details Card */}
      <div className="bg-white rounded-md border">
        <div className="border-b px-4 py-2">
          <h2 className="text-sm font-semibold">Incident Details</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-x-6 gap-y-3">
            <EditableField
              label="Case Type"
              value={caseType}
              onChange={(val) => {
                setCaseType(val);
                markAsChanged();
              }}
              isEditing={isEditing}
              type="select"
              options={[
                { value: "dog_bites", label: "Dog Bites" },
                { value: "mva", label: "Motor Vehicle Accident" },
                { value: "slip_and_fall", label: "Slip and Fall" },
              ]}
            />
            <EditableField
              label="Date"
              value={incidentDate}
              onChange={(val) => {
                setIncidentDate(val);
                markAsChanged();
              }}
              isEditing={isEditing}
              type="date"
            />
            <EditableField
              label="Location"
              value={incidentLocation}
              onChange={(val) => {
                setIncidentLocation(val);
                markAsChanged();
              }}
              isEditing={isEditing}
            />
          </div>
        </div>
      </div>

      {/* Intake Form Card */}
      <div className="bg-white rounded-md border">
        <div className="border-b px-4 py-2">
          <h2 className="text-sm font-semibold">Intake Form</h2>
        </div>

        <div className="divide-y">
          {/* Liability Section */}
          <Section title="Liability">
            {!isEditing && (
              <div className="mb-2 text-xs text-gray-500 italic">
                💡 Citations will appear here when transcript is processed with turn tracking
              </div>
            )}
            {isEditing ? (
              <div className="space-y-2">
                <Label className="text-xs">Liability Content (Markdown)</Label>
                <Textarea
                  value={liability.content}
                  onChange={(e) => {
                    setLiability({ ...liability, content: e.target.value });
                    markAsChanged();
                  }}
                  placeholder="Enter liability information (supports markdown)"
                  className="min-h-[120px] text-sm"
                />
                <div className="flex items-center gap-2">
                  <Label htmlFor="hasPoliceReport" className="text-xs">
                    Police Report:
                  </Label>
                  <div className="flex gap-2">
                    <ThreeStateButton
                      value={liability.hasPoliceReport}
                      trueLabel="Yes"
                      falseLabel="No"
                      onChange={(val) => {
                        setLiability({ ...liability, hasPoliceReport: val as boolean });
                        markAsChanged();
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {liability.content ? (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {liability.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <EmptyState text="No liability information provided" />
                )}
                <div className="mt-3 pt-3 border-t">
                  <DataField
                    label="Police Report"
                    value={liability.hasPoliceReport ? "Yes" : "No"}
                    inline
                  />
                </div>
              </>
            )}
          </Section>

          {/* Damages Section */}
          <Section title="Damages">
            {isEditing ? (
              <DamagesEditor damages={damages} setDamages={(val) => { setDamages(val); markAsChanged(); }} />
            ) : (
              <>
                <DataField
                  label="Overall Severity"
                  value={
                    damages.severity.charAt(0).toUpperCase() +
                    damages.severity.slice(1)
                  }
                  inline
                />
                {damages.indications.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-700">
                      Indications ({damages.indications.length}):
                    </p>
                    {damages.indications.map((indication, index) => (
                      <div
                        key={index}
                        className="pl-3 py-2 border-l-2 border-gray-300 bg-gray-50 rounded"
                      >
                        <p className="text-sm">{indication.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Severity:{" "}
                          <span
                            className={`font-medium ${
                              indication.severity === "high"
                                ? "text-red-600"
                                : indication.severity === "medium"
                                  ? "text-orange-600"
                                  : "text-green-600"
                            }`}
                          >
                            {indication.severity.charAt(0).toUpperCase() +
                              indication.severity.slice(1)}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState text="No damage indications recorded" />
                )}
              </>
            )}
          </Section>

          {/* Insurance Coverage Section */}
          <Section title="Insurance Coverage">
            {isEditing ? (
              <CoverageEditor coverage={coverage} setCoverage={(val) => { setCoverage(val); markAsChanged(); }} incidentDate={incidentDate} />
            ) : (
              <div className="space-y-4">
                {/* Client Insurance */}
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <h4 className="text-xs font-semibold text-blue-900 mb-2">
                    Client Insurance
                  </h4>
                  <StatusBadge value={coverage.clientHasInsurance} />
                  {coverage.clientHasInsurance && (
                    <div className="mt-2 space-y-1.5">
                      <DataField
                        label="Provider"
                        value={coverage.clientInsuranceProvider}
                        inline
                      />
                      <DataField
                        label="Policy #"
                        value={coverage.clientPolicyNumber}
                        inline
                      />
                      {(coverage.clientCoverageEffectiveDate ||
                        coverage.clientCoverageExpirationDate) && (
                        <div>
                          <p className="text-xs text-gray-600">
                            Coverage Period:{" "}
                            {coverage.clientCoverageEffectiveDate
                              ? new Date(
                                  coverage.clientCoverageEffectiveDate
                                ).toLocaleDateString()
                              : "Unknown"}{" "}
                            -{" "}
                            {coverage.clientCoverageExpirationDate
                              ? new Date(
                                  coverage.clientCoverageExpirationDate
                                ).toLocaleDateString()
                              : "Ongoing"}
                          </p>
                          {clientCoverageWarning && (
                            <p
                              className={`text-xs mt-1 font-medium ${
                                clientCoverageWarning.startsWith("⚠️")
                                  ? "text-red-600"
                                  : "text-green-600"
                              }`}
                            >
                              {clientCoverageWarning}
                            </p>
                          )}
                        </div>
                      )}
                      {coverage.clientCoverageDetails && (
                        <div className="mt-2 pt-2 border-t border-blue-200">
                          <p className="text-xs text-gray-600 mb-1">Coverage Details:</p>
                          <p className="text-sm text-gray-800">{coverage.clientCoverageDetails}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Other Party Insurance */}
                <div className="bg-amber-50 border border-amber-200 rounded p-3">
                  <h4 className="text-xs font-semibold text-amber-900 mb-2">
                    Other Party Insurance
                  </h4>
                  <StatusBadge value={coverage.otherPartyHasInsurance} />
                  {coverage.otherPartyHasInsurance && (
                    <div className="mt-2 space-y-1.5">
                      <DataField
                        label="Provider"
                        value={coverage.otherPartyInsuranceProvider}
                        inline
                      />
                      <DataField
                        label="Policy #"
                        value={coverage.otherPartyPolicyNumber}
                        inline
                      />
                      {(coverage.otherPartyCoverageEffectiveDate ||
                        coverage.otherPartyCoverageExpirationDate) && (
                        <div>
                          <p className="text-xs text-gray-600">
                            Coverage Period:{" "}
                            {coverage.otherPartyCoverageEffectiveDate
                              ? new Date(
                                  coverage.otherPartyCoverageEffectiveDate
                                ).toLocaleDateString()
                              : "Unknown"}{" "}
                            -{" "}
                            {coverage.otherPartyCoverageExpirationDate
                              ? new Date(
                                  coverage.otherPartyCoverageExpirationDate
                                ).toLocaleDateString()
                              : "Ongoing"}
                          </p>
                          {otherPartyCoverageWarning && (
                            <p
                              className={`text-xs mt-1 font-medium ${
                                otherPartyCoverageWarning.startsWith("⚠️")
                                  ? "text-red-600"
                                  : "text-green-600"
                              }`}
                            >
                              {otherPartyCoverageWarning}
                            </p>
                          )}
                        </div>
                      )}
                      {coverage.otherPartyCoverageDetails && (
                        <div className="mt-2 pt-2 border-t border-amber-200">
                          <p className="text-xs text-gray-600 mb-1">Coverage Details:</p>
                          <p className="text-sm text-gray-800">{coverage.otherPartyCoverageDetails}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Medical Coverage */}
                {(coverage.medicalCoverageAvailable !== null || coverage.medicalCoverageDetails) && (
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <h4 className="text-xs font-semibold text-green-900 mb-2">
                      Medical Coverage
                    </h4>
                    <StatusBadge value={coverage.medicalCoverageAvailable} />
                    {coverage.medicalCoverageDetails && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 mb-1">Details:</p>
                        <p className="text-sm text-gray-800">{coverage.medicalCoverageDetails}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* UM/UIM Coverage */}
                {coverage.underinsuredMotoristCoverage !== null && (
                  <div className="bg-purple-50 border border-purple-200 rounded p-3">
                    <h4 className="text-xs font-semibold text-purple-900 mb-2">
                      Underinsured/Uninsured Motorist Coverage
                    </h4>
                    <StatusBadge value={coverage.underinsuredMotoristCoverage} />
                  </div>
                )}

                {/* Policy Limits & Notes */}
                {coverage.policyLimits && (
                  <DataField
                    label="Policy Limits"
                    value={coverage.policyLimits}
                    inline
                  />
                )}
                {coverage.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-600 mb-1">
                      Additional Notes:
                    </p>
                    <p className="text-sm text-gray-800">{coverage.notes}</p>
                  </div>
                )}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4">
      <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function DataField({
  label,
  value,
  inline = false,
  span = 1,
}: {
  label: string;
  value: string | null | undefined;
  inline?: boolean;
  span?: number;
}) {
  if (inline) {
    return (
      <div className="flex items-baseline gap-2">
        <span className="text-xs text-gray-600">{label}:</span>
        <span className="text-sm font-medium">
          {value || (
            <span className="text-gray-400 italic font-normal">
              Not provided
            </span>
          )}
        </span>
      </div>
    );
  }

  return (
    <div className={span > 1 ? `col-span-${span}` : ""}>
      <p className="text-xs text-gray-600 mb-0.5">{label}</p>
      <p className="text-sm font-medium">
        {value || (
          <span className="text-gray-400 italic font-normal">Not provided</span>
        )}
      </p>
    </div>
  );
}

function EditableField({
  label,
  value,
  onChange,
  isEditing,
  type = "text",
  span = 1,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isEditing: boolean;
  type?: "text" | "email" | "date" | "select";
  span?: number;
  options?: { value: string; label: string }[];
}) {
  const className = span > 1 ? `col-span-${span}` : "";

  if (isEditing) {
    return (
      <div className={className}>
        <Label className="text-xs text-gray-600 mb-0.5">{label}</Label>
        {type === "select" ? (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <Input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 text-sm"
          />
        )}
      </div>
    );
  }

  // View mode - format display value
  let displayValue = value;
  if (type === "date" && value) {
    displayValue = new Date(value).toLocaleDateString();
  } else if (type === "select" && options) {
    displayValue = options.find((o) => o.value === value)?.label || value;
  }

  return (
    <div className={className}>
      <p className="text-xs text-gray-600 mb-0.5">{label}</p>
      <p className="text-sm font-medium">
        {displayValue || (
          <span className="text-gray-400 italic font-normal">Not provided</span>
        )}
      </p>
    </div>
  );
}

function ThreeStateButton({
  value,
  trueLabel,
  falseLabel,
  onChange,
}: {
  value: boolean;
  trueLabel: string;
  falseLabel: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-3 py-1 text-xs border rounded ${
          value === true
            ? "bg-blue-50 border-blue-500 text-blue-700"
            : "bg-white border-gray-300"
        }`}
      >
        {trueLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-3 py-1 text-xs border rounded ${
          value === false
            ? "bg-blue-50 border-blue-500 text-blue-700"
            : "bg-white border-gray-300"
        }`}
      >
        {falseLabel}
      </button>
    </div>
  );
}

function DamagesEditor({
  damages,
  setDamages,
}: {
  damages: Damages;
  setDamages: (damages: Damages) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs mb-1">Overall Severity</Label>
        <select
          value={damages.severity}
          onChange={(e) =>
            setDamages({ ...damages, severity: e.target.value as Severity })
          }
          className="h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs">Indications</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setDamages({
                ...damages,
                indications: [
                  ...damages.indications,
                  { description: "", severity: "medium" as Severity },
                ],
              })
            }
          >
            Add Indication
          </Button>
        </div>

        {damages.indications.map((indication, index) => (
          <div key={index} className="border rounded p-3 space-y-2 mb-2">
            <div>
              <Label className="text-xs">Description</Label>
              <Input
                value={indication.description}
                onChange={(e) => {
                  const newIndications = [...damages.indications];
                  newIndications[index].description = e.target.value;
                  setDamages({ ...damages, indications: newIndications });
                }}
                className="h-8 text-sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="text-xs">Severity</Label>
                <select
                  value={indication.severity}
                  onChange={(e) => {
                    const newIndications = [...damages.indications];
                    newIndications[index].severity = e.target
                      .value as Severity;
                    setDamages({ ...damages, indications: newIndications });
                  }}
                  className="h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  const newIndications = damages.indications.filter(
                    (_, i) => i !== index
                  );
                  setDamages({ ...damages, indications: newIndications });
                }}
                className="ml-2 mt-4"
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoverageEditor({
  coverage,
  setCoverage,
  incidentDate,
}: {
  coverage: Coverage;
  setCoverage: (coverage: Coverage) => void;
  incidentDate: string;
}) {
  const getCoverageDateWarning = (
    effectiveDate?: string | null,
    expirationDate?: string | null
  ) => {
    if (!incidentDate || !effectiveDate) return null;

    const incident = new Date(incidentDate);
    const effective = new Date(effectiveDate);
    const expiration = expirationDate ? new Date(expirationDate) : null;

    if (incident < effective) {
      return "⚠️ Incident occurred before coverage effective date";
    }
    if (expiration && incident > expiration) {
      return "⚠️ Incident occurred after coverage expired";
    }
    return "✓ Coverage valid on incident date";
  };

  const clientCoverageWarning = getCoverageDateWarning(
    coverage.clientCoverageEffectiveDate,
    coverage.clientCoverageExpirationDate
  );

  const otherPartyCoverageWarning = getCoverageDateWarning(
    coverage.otherPartyCoverageEffectiveDate,
    coverage.otherPartyCoverageExpirationDate
  );

  return (
    <div className="space-y-4">
      {/* Client Insurance */}
      <div className="bg-blue-50 border border-blue-200 rounded p-3">
        <h4 className="text-xs font-semibold text-blue-900 mb-2">
          Client Insurance
        </h4>
        <div className="space-y-2">
          <div>
            <Label className="text-xs mb-1">Has Insurance?</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setCoverage({ ...coverage, clientHasInsurance: true })
                }
                className={`flex-1 px-2 py-1 text-xs border rounded ${
                  coverage.clientHasInsurance === true
                    ? "bg-blue-100 border-blue-600 text-blue-800"
                    : "bg-white border-gray-300"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() =>
                  setCoverage({ ...coverage, clientHasInsurance: false })
                }
                className={`flex-1 px-2 py-1 text-xs border rounded ${
                  coverage.clientHasInsurance === false
                    ? "bg-blue-100 border-blue-600 text-blue-800"
                    : "bg-white border-gray-300"
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() =>
                  setCoverage({ ...coverage, clientHasInsurance: null })
                }
                className={`flex-1 px-2 py-1 text-xs border rounded ${
                  coverage.clientHasInsurance === null
                    ? "bg-blue-100 border-blue-600 text-blue-800"
                    : "bg-white border-gray-300"
                }`}
              >
                Unknown
              </button>
            </div>
          </div>

          <div>
            <Label className="text-xs">Provider</Label>
            <Input
              value={coverage.clientInsuranceProvider || ""}
              onChange={(e) =>
                setCoverage({
                  ...coverage,
                  clientInsuranceProvider: e.target.value,
                })
              }
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Policy Number</Label>
            <Input
              value={coverage.clientPolicyNumber || ""}
              onChange={(e) =>
                setCoverage({
                  ...coverage,
                  clientPolicyNumber: e.target.value,
                })
              }
              className="h-8 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Effective Date</Label>
              <Input
                type="date"
                value={coverage.clientCoverageEffectiveDate || ""}
                onChange={(e) =>
                  setCoverage({
                    ...coverage,
                    clientCoverageEffectiveDate: e.target.value,
                  })
                }
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Expiration Date</Label>
              <Input
                type="date"
                value={coverage.clientCoverageExpirationDate || ""}
                onChange={(e) =>
                  setCoverage({
                    ...coverage,
                    clientCoverageExpirationDate: e.target.value,
                  })
                }
                className="h-8 text-sm"
              />
            </div>
          </div>
          {clientCoverageWarning && (
            <p
              className={`text-xs font-medium ${
                clientCoverageWarning.startsWith("⚠️")
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {clientCoverageWarning}
            </p>
          )}
          <div>
            <Label className="text-xs">Coverage Details</Label>
            <Textarea
              value={coverage.clientCoverageDetails || ""}
              onChange={(e) =>
                setCoverage({
                  ...coverage,
                  clientCoverageDetails: e.target.value,
                })
              }
              className="text-sm min-h-[60px]"
              placeholder="Additional coverage details..."
            />
          </div>
        </div>
      </div>

      {/* Other Party Insurance */}
      <div className="bg-amber-50 border border-amber-200 rounded p-3">
        <h4 className="text-xs font-semibold text-amber-900 mb-2">
          Other Party Insurance
        </h4>
        <div className="space-y-2">
          <div>
            <Label className="text-xs mb-1">Has Insurance?</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setCoverage({ ...coverage, otherPartyHasInsurance: true })
                }
                className={`flex-1 px-2 py-1 text-xs border rounded ${
                  coverage.otherPartyHasInsurance === true
                    ? "bg-amber-100 border-amber-600 text-amber-800"
                    : "bg-white border-gray-300"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() =>
                  setCoverage({ ...coverage, otherPartyHasInsurance: false })
                }
                className={`flex-1 px-2 py-1 text-xs border rounded ${
                  coverage.otherPartyHasInsurance === false
                    ? "bg-amber-100 border-amber-600 text-amber-800"
                    : "bg-white border-gray-300"
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() =>
                  setCoverage({ ...coverage, otherPartyHasInsurance: null })
                }
                className={`flex-1 px-2 py-1 text-xs border rounded ${
                  coverage.otherPartyHasInsurance === null
                    ? "bg-amber-100 border-amber-600 text-amber-800"
                    : "bg-white border-gray-300"
                }`}
              >
                Unknown
              </button>
            </div>
          </div>

          <div>
            <Label className="text-xs">Provider</Label>
            <Input
              value={coverage.otherPartyInsuranceProvider || ""}
              onChange={(e) =>
                setCoverage({
                  ...coverage,
                  otherPartyInsuranceProvider: e.target.value,
                })
              }
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Policy Number</Label>
            <Input
              value={coverage.otherPartyPolicyNumber || ""}
              onChange={(e) =>
                setCoverage({
                  ...coverage,
                  otherPartyPolicyNumber: e.target.value,
                })
              }
              className="h-8 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Effective Date</Label>
              <Input
                type="date"
                value={coverage.otherPartyCoverageEffectiveDate || ""}
                onChange={(e) =>
                  setCoverage({
                    ...coverage,
                    otherPartyCoverageEffectiveDate: e.target.value,
                  })
                }
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Expiration Date</Label>
              <Input
                type="date"
                value={coverage.otherPartyCoverageExpirationDate || ""}
                onChange={(e) =>
                  setCoverage({
                    ...coverage,
                    otherPartyCoverageExpirationDate: e.target.value,
                  })
                }
                className="h-8 text-sm"
              />
            </div>
          </div>
          {otherPartyCoverageWarning && (
            <p
              className={`text-xs font-medium ${
                otherPartyCoverageWarning.startsWith("⚠️")
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {otherPartyCoverageWarning}
            </p>
          )}
          <div>
            <Label className="text-xs">Coverage Details</Label>
            <Textarea
              value={coverage.otherPartyCoverageDetails || ""}
              onChange={(e) =>
                setCoverage({
                  ...coverage,
                  otherPartyCoverageDetails: e.target.value,
                })
              }
              className="text-sm min-h-[60px]"
              placeholder="Additional coverage details..."
            />
          </div>
        </div>
      </div>

      {/* Medical Coverage */}
      <div className="bg-green-50 border border-green-200 rounded p-3">
        <h4 className="text-xs font-semibold text-green-900 mb-2">
          Medical Coverage
        </h4>
        <div className="space-y-2">
          <div>
            <Label className="text-xs mb-1">Available?</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setCoverage({ ...coverage, medicalCoverageAvailable: true })
                }
                className={`flex-1 px-2 py-1 text-xs border rounded ${
                  coverage.medicalCoverageAvailable === true
                    ? "bg-green-100 border-green-600 text-green-800"
                    : "bg-white border-gray-300"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() =>
                  setCoverage({ ...coverage, medicalCoverageAvailable: false })
                }
                className={`flex-1 px-2 py-1 text-xs border rounded ${
                  coverage.medicalCoverageAvailable === false
                    ? "bg-green-100 border-green-600 text-green-800"
                    : "bg-white border-gray-300"
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() =>
                  setCoverage({ ...coverage, medicalCoverageAvailable: null })
                }
                className={`flex-1 px-2 py-1 text-xs border rounded ${
                  coverage.medicalCoverageAvailable === null
                    ? "bg-green-100 border-green-600 text-green-800"
                    : "bg-white border-gray-300"
                }`}
              >
                Unknown
              </button>
            </div>
          </div>
          <div>
            <Label className="text-xs">Medical Coverage Details</Label>
            <Textarea
              value={coverage.medicalCoverageDetails || ""}
              onChange={(e) =>
                setCoverage({
                  ...coverage,
                  medicalCoverageDetails: e.target.value,
                })
              }
              className="text-sm min-h-[60px]"
              placeholder="Medical coverage details..."
            />
          </div>
        </div>
      </div>

      {/* UM/UIM Coverage */}
      <div className="bg-purple-50 border border-purple-200 rounded p-3">
        <h4 className="text-xs font-semibold text-purple-900 mb-2">
          Underinsured/Uninsured Motorist Coverage
        </h4>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              setCoverage({ ...coverage, underinsuredMotoristCoverage: true })
            }
            className={`flex-1 px-2 py-1 text-xs border rounded ${
              coverage.underinsuredMotoristCoverage === true
                ? "bg-purple-100 border-purple-600 text-purple-800"
                : "bg-white border-gray-300"
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() =>
              setCoverage({ ...coverage, underinsuredMotoristCoverage: false })
            }
            className={`flex-1 px-2 py-1 text-xs border rounded ${
              coverage.underinsuredMotoristCoverage === false
                ? "bg-purple-100 border-purple-600 text-purple-800"
                : "bg-white border-gray-300"
            }`}
          >
            No
          </button>
          <button
            type="button"
            onClick={() =>
              setCoverage({ ...coverage, underinsuredMotoristCoverage: null })
            }
            className={`flex-1 px-2 py-1 text-xs border rounded ${
              coverage.underinsuredMotoristCoverage === null
                ? "bg-purple-100 border-purple-600 text-purple-800"
                : "bg-white border-gray-300"
            }`}
          >
            Unknown
          </button>
        </div>
      </div>

      {/* Policy Limits & Notes */}
      <div>
        <Label className="text-xs">Policy Limits</Label>
        <Input
          value={coverage.policyLimits || ""}
          onChange={(e) =>
            setCoverage({ ...coverage, policyLimits: e.target.value })
          }
          className="h-8 text-sm"
          placeholder="e.g., $100,000/$300,000"
        />
      </div>

      <div>
        <Label className="text-xs">Additional Notes</Label>
        <Textarea
          value={coverage.notes || ""}
          onChange={(e) =>
            setCoverage({ ...coverage, notes: e.target.value })
          }
          className="text-sm min-h-[80px]"
          placeholder="Any additional coverage information..."
        />
      </div>
    </div>
  );
}

function StatusBadge({ value }: { value: boolean | null }) {
  if (value === null) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
        Unknown
      </span>
    );
  }
  if (value) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
        ✓ Yes
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
      ✗ No
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-gray-400 italic py-2">{text}</p>;
}
