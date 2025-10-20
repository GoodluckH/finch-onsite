"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { CitationBadge } from "./citation-badge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { LiabilityWithCitations } from "@/lib/ai/citation-types";

interface LiabilitySectionWithCitationsProps {
  liability: LiabilityWithCitations;
  onChange: (liability: LiabilityWithCitations) => void;
  turns?: Array<{
    id: number;
    speaker: number;
    content: string;
    turnIndex: number;
  }>;
  onScrollToTurn?: (turnId: number) => void;
}

export function LiabilitySectionWithCitations({
  liability,
  onChange,
  turns,
  onScrollToTurn,
}: LiabilitySectionWithCitationsProps) {
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);

  return (
    <div className="border rounded-md p-3 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-semibold text-gray-700">
            Liability
          </Label>
          {liability.citations?.content && (
            <CitationBadge
              turnIds={liability.citations.content}
              turns={turns}
              onClickCitation={onScrollToTurn}
            />
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowMarkdownPreview(!showMarkdownPreview)}
          className="h-6 text-xs"
        >
          {showMarkdownPreview ? "Edit" : "Preview"}
        </Button>
      </div>

      {showMarkdownPreview ? (
        <div className="bg-white border rounded-md p-3 prose prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {liability.content || "*No liability information provided*"}
          </ReactMarkdown>
        </div>
      ) : (
        <Textarea
          value={liability.content}
          onChange={(e) =>
            onChange({
              ...liability,
              content: e.target.value,
            })
          }
          placeholder="Enter liability details in markdown format..."
          className="h-32 text-sm bg-white"
        />
      )}

      <div className="mt-3 flex items-center gap-2">
        <Checkbox
          id="hasPoliceReport"
          checked={liability.hasPoliceReport}
          onCheckedChange={(checked: boolean) =>
            onChange({
              ...liability,
              hasPoliceReport: checked,
            })
          }
        />
        <Label
          htmlFor="hasPoliceReport"
          className="text-xs font-medium text-gray-700 cursor-pointer flex items-center gap-2"
        >
          Police Report Filed
          {liability.citations?.hasPoliceReport && (
            <CitationBadge
              turnIds={liability.citations.hasPoliceReport}
              turns={turns}
              onClickCitation={onScrollToTurn}
            />
          )}
        </Label>
      </div>
    </div>
  );
}
