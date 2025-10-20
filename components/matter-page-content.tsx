"use client";

import { useState } from "react";
import { MatterDetailView } from "@/components/matter-detail-view";
import { TranscriptViewer } from "@/components/transcript-viewer";
import type { Transcript } from "@/lib/ai/types";

interface MatterPageContentProps {
  matter: any;
  transcript: Transcript | null;
  turns: any[] | null;
}

export function MatterPageContent({ matter, transcript, turns }: MatterPageContentProps) {
  const [highlightedTurnIds, setHighlightedTurnIds] = useState<number[]>([]);

  const handleCitationClick = (turnIds: number[]) => {
    // If clicking the same citations, deselect (clear highlights)
    if (JSON.stringify(highlightedTurnIds) === JSON.stringify(turnIds)) {
      setHighlightedTurnIds([]);
    } else {
      setHighlightedTurnIds(turnIds);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left column: Intake form */}
      <div>
        <MatterDetailView
          matter={matter}
          intakeFormDataId={matter.intakeFormData.id}
          initialIntakeData={{
            caseType: matter.intakeFormData.caseType as string,
            liability: matter.intakeFormData.liability as any,
            damages: matter.intakeFormData.damages as any,
            coverage: matter.intakeFormData.coverage as any,
          }}
          onCitationClick={handleCitationClick}
        />
      </div>

      {/* Right column: Transcript viewer */}
      {transcript && (
        <div className="lg:sticky lg:top-4 lg:self-start">
          <TranscriptViewer
            transcript={transcript}
            turns={turns || []}
            highlightedTurnIds={highlightedTurnIds}
          />
        </div>
      )}
    </div>
  );
}
