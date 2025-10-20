"use client";

import { useState } from "react";

interface Turn {
  id: number;
  speaker: number;
  content: string;
  turnIndex: number;
}

interface CitationBadgeProps {
  turnIds?: number[];
  turns?: Turn[]; // Optional: full turn data for rich tooltips
  onClickCitation?: (turnIds: number[]) => void; // Now accepts array of turn IDs
}

// Color palette matching transcript viewer
const SPEAKER_COLORS = [
  { text: "text-blue-600", bg: "bg-blue-50" },
  { text: "text-green-600", bg: "bg-green-50" },
  { text: "text-purple-600", bg: "bg-purple-50" },
  { text: "text-orange-600", bg: "bg-orange-50" },
  { text: "text-pink-600", bg: "bg-pink-50" },
] as const;

function getSpeakerColor(speaker: number) {
  return SPEAKER_COLORS[speaker % SPEAKER_COLORS.length];
}

export function CitationBadge({
  turnIds,
  turns,
  onClickCitation,
}: CitationBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!turnIds || turnIds.length === 0) {
    return null;
  }

  // Get turn details if available
  const citedTurns = turns?.filter((turn) => turnIds.includes(turn.id)) || [];

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onClickCitation?.(turnIds)}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
      >
        <svg
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span>
          {turnIds.length} {turnIds.length === 1 ? "source" : "sources"}
        </span>
      </button>

      {/* Tooltip on hover */}
      {isHovered && citedTurns.length > 0 && (
        <div className="absolute z-50 left-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="px-3 py-2 border-b bg-gray-50 rounded-t-lg">
            <h4 className="text-xs font-semibold text-gray-700">
              Sources for this information
            </h4>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {citedTurns.map((turn) => {
              const colors = getSpeakerColor(turn.speaker);
              // Truncate content for tooltip
              const excerpt =
                turn.content.length > 120
                  ? turn.content.substring(0, 120) + "..."
                  : turn.content;

              return (
                <div
                  key={turn.id}
                  className={`px-3 py-2 border-b last:border-b-0 ${colors.bg} hover:bg-opacity-70 transition-colors`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium ${colors.text}`}>
                      Speaker {turn.speaker}
                    </span>
                    <span className="text-xs text-gray-400">
                      Turn {turn.turnIndex + 1}
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed ${colors.text}`}>
                    "{excerpt}"
                  </p>
                </div>
              );
            })}
          </div>
          {onClickCitation && (
            <div className="px-3 py-2 bg-gray-50 rounded-b-lg border-t">
              <button
                type="button"
                onClick={() => onClickCitation(turnIds)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                View in transcript →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
