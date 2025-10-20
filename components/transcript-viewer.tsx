"use client";

import type { Transcript } from "@/lib/ai/types";

interface TranscriptViewerProps {
  transcript: Transcript;
}

// Color palette for speakers
const SPEAKER_COLORS = [
  {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    label: "bg-blue-100",
  },
  {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    label: "bg-green-100",
  },
  {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    label: "bg-purple-100",
  },
  {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    label: "bg-orange-100",
  },
  {
    bg: "bg-pink-50",
    text: "text-pink-700",
    border: "border-pink-200",
    label: "bg-pink-100",
  },
] as const;

function getSpeakerColors(speaker: number) {
  return SPEAKER_COLORS[speaker % SPEAKER_COLORS.length];
}

export function TranscriptViewer({ transcript }: TranscriptViewerProps) {
  return (
    <div className="border rounded-md bg-white">
      {/* Header */}
      <div className="border-b bg-gray-50 px-4 py-2">
        <h3 className="text-sm font-medium text-gray-900">Raw Transcript</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {transcript.segments.length} segments
        </p>
      </div>

      {/* Transcript content */}
      <div className="max-h-[600px] overflow-y-auto">
        {transcript.segments.map((segment, index) => {
          const colors = getSpeakerColors(segment.speaker);

          return (
            <div
              key={index}
              className={`border-l-4 ${colors.border} ${colors.bg} px-4 py-3 transition-colors hover:bg-opacity-80`}
            >
              {/* Speaker label */}
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors.label} ${colors.text}`}
                >
                  Speaker {segment.speaker}
                </span>
                <span className="text-xs text-gray-400">Turn {index + 1}</span>
              </div>

              {/* Content */}
              <p className={`text-sm leading-relaxed ${colors.text}`}>
                {segment.content}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
