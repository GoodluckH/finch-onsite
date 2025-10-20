"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Liability, Damages, Indication } from "@/db/types";
import { updateIntakeFormData } from "@/app/actions/matters";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type IntakeFormEditorProps = {
  intakeFormDataId: number;
  initialData: {
    caseType: string;
    liability: Liability;
    damages: Damages;
  };
};

export function IntakeFormEditor({
  intakeFormDataId,
  initialData,
}: IntakeFormEditorProps) {
  const [caseType, setCaseType] = useState(initialData.caseType);
  const [liability, setLiability] = useState<Liability>(initialData.liability);
  const [damages, setDamages] = useState<Damages>(initialData.damages);
  const [isSaving, setIsSaving] = useState(false);
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track changes
  useEffect(() => {
    const isDirty =
      caseType !== initialData.caseType ||
      JSON.stringify(liability) !== JSON.stringify(initialData.liability) ||
      JSON.stringify(damages) !== JSON.stringify(initialData.damages);
    setHasUnsavedChanges(isDirty);
  }, [caseType, liability, damages, initialData]);

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateIntakeFormData(intakeFormDataId, {
        caseType,
        liability,
        damages,
      });
      setHasUnsavedChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const addIndication = () => {
    setDamages({
      ...damages,
      indications: [
        ...damages.indications,
        { description: "", severity: "low", evidence: [] },
      ],
    });
  };

  const removeIndication = (index: number) => {
    setDamages({
      ...damages,
      indications: damages.indications.filter((_, i) => i !== index),
    });
  };

  const updateIndication = (index: number, updated: Indication) => {
    setDamages({
      ...damages,
      indications: damages.indications.map((ind, i) =>
        i === index ? updated : ind
      ),
    });
  };

  return (
    <div
      className="bg-white rounded-md border p-4 space-y-4"
      data-unsaved-changes={hasUnsavedChanges}
    >
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Intake Form</h2>
          {hasUnsavedChanges && (
            <span className="text-xs text-orange-600 font-medium">
              (Unsaved changes)
            </span>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasUnsavedChanges}
          size="sm"
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* Case Type */}
      <div className="space-y-1">
        <Label className="text-xs font-medium">Case Type</Label>
        <Select value={caseType} onValueChange={setCaseType}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dog_bites">Dog Bites</SelectItem>
            <SelectItem value="mva">MVA</SelectItem>
            <SelectItem value="slip_and_fall">Slip and Fall</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Liability Section */}
      <div className="border rounded-md p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-700">Liability</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowMarkdownPreview(!showMarkdownPreview)}
            className="h-6 px-2 text-xs"
          >
            {showMarkdownPreview ? "Edit" : "Preview"}
          </Button>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">
            Content{" "}
            <span className="text-muted-foreground font-normal">
              (Markdown supported)
            </span>
          </Label>
          {showMarkdownPreview ? (
            <div className="min-h-[60px] text-sm border rounded-md p-2 bg-gray-50">
              {liability.content ? (
                <div className="prose prose-sm max-w-none prose-ul:my-1 prose-li:my-0">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {liability.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <span className="text-muted-foreground text-xs">
                  No content to preview
                </span>
              )}
            </div>
          ) : (
            <Textarea
              value={liability.content}
              onChange={(e) =>
                setLiability({ ...liability, content: e.target.value })
              }
              className="min-h-[60px] text-sm font-mono"
              placeholder="Describe liability... (use markdown format, e.g., bulleted lists with -)&#10;&#10;Example:&#10;- Client was driving south on Main St&#10;- Defendant ran red light&#10;- Weather conditions were clear"
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="hasPoliceReport"
            checked={liability.hasPoliceReport}
            onChange={(e) =>
              setLiability({ ...liability, hasPoliceReport: e.target.checked })
            }
            className="h-3 w-3"
          />
          <Label htmlFor="hasPoliceReport" className="text-xs cursor-pointer">
            Police Report Available
          </Label>
        </div>
      </div>

      {/* Damages Section */}
      <div className="border rounded-md p-3 space-y-3">
        <h3 className="text-xs font-semibold text-gray-700">Damages</h3>

        <div className="space-y-1">
          <Label className="text-xs">Overall Severity</Label>
          <Select
            value={damages.severity}
            onValueChange={(value: any) =>
              setDamages({ ...damages, severity: value })
            }
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Indications */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Indications</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addIndication}
              className="h-6 text-xs"
            >
              + Add
            </Button>
          </div>

          {damages.indications.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              No indications yet. Click "Add" to create one.
            </p>
          ) : (
            <div className="space-y-2">
              {damages.indications.map((indication, index) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                  key={index}
                  className="border rounded p-2 space-y-2 bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Description</Label>
                        <Textarea
                          value={indication.description}
                          onChange={(e) =>
                            updateIndication(index, {
                              ...indication,
                              description: e.target.value,
                            })
                          }
                          className="min-h-[50px] text-sm bg-white"
                          placeholder="Describe the indication..."
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Severity</Label>
                        <Select
                          value={indication.severity}
                          onValueChange={(value: any) =>
                            updateIndication(index, {
                              ...indication,
                              severity: value,
                            })
                          }
                        >
                          <SelectTrigger className="h-7 text-sm bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIndication(index)}
                      className="h-6 px-2 text-xs"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
