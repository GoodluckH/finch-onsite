import { CitationBadge } from "@/components/citation-badge";
import { TranscriptViewer } from "@/components/transcript-viewer";
import { LiabilitySectionWithCitations } from "@/components/liability-section-with-citations";

// Mock data for demonstration
const mockTranscript = {
  segments: [
    {
      speaker: 0,
      content: "Good afternoon, Ms. Harris. This is Anthony Rodriguez from Carson & Pine. How are you holding up?",
    },
    {
      speaker: 1,
      content: "Hi Anthony, I'm managing, thank you. Still quite shaken from the accident though.",
    },
    {
      speaker: 0,
      content: "I completely understand. Can you walk me through what happened on the day of the accident?",
    },
    {
      speaker: 1,
      content: "I was driving south on Main Street, going about 35 miles per hour. The light at the intersection of Main and 5th Avenue was green for me. Suddenly, this pickup truck came from the left and ran straight through the red light. I tried to brake but there wasn't enough time.",
    },
    {
      speaker: 0,
      content: "That must have been terrifying. Did anyone witness the accident?",
    },
    {
      speaker: 1,
      content: "Yes! There were several cars stopped at the light. The police took statements from at least two witnesses. They both confirmed that the other driver ran the red light.",
    },
  ],
};

const mockTurns = mockTranscript.segments.map((seg, index) => ({
  id: index + 1,
  speaker: seg.speaker,
  content: seg.content,
  turnIndex: index,
  transcriptId: 1,
}));

const mockLiability = {
  content: `- Client was driving south on Main Street at approximately 35 mph
- Traffic light was green for client at intersection of Main St and 5th Ave
- Other driver (pickup truck) ran red light from the left
- Client attempted to brake but insufficient time to avoid collision
- Multiple witnesses present at the scene
- At least two witnesses confirmed other driver ran red light
- Police took witness statements at the scene`,
  hasPoliceReport: true,
  citations: {
    content: [4, 6], // Turn IDs 4 and 6 contributed to liability content
    hasPoliceReport: [6], // Turn ID 6 mentioned police report
  },
};

export default function CitationDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Citation System Demo</h1>
          <p className="text-sm text-gray-600 mt-1">
            This page demonstrates how citations link extracted data back to transcript turns
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Extracted data with citations */}
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Extracted Data with Citations</h2>

              <LiabilitySectionWithCitations
                liability={mockLiability}
                onChange={() => {}}
                turns={mockTurns}
              />

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  How Citations Work
                </h3>
                <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                  <li>Badge shows number of source turns</li>
                  <li>Hover over badge to see excerpts</li>
                  <li>Click to scroll to turn in transcript (not implemented yet)</li>
                  <li>Color-coded to match speaker colors</li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-gray-100 border rounded">
                <h3 className="text-sm font-semibold mb-2">Example: Field-Level Citations</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white p-2 rounded border">
                    <span className="text-sm">Client Name:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Sarah Harris</span>
                      <CitationBadge turnIds={[1, 2]} turns={mockTurns} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2 rounded border">
                    <span className="text-sm">Incident Location:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Main St & 5th Ave</span>
                      <CitationBadge turnIds={[4]} turns={mockTurns} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2 rounded border">
                    <span className="text-sm">Witnesses Present:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Yes, 2+ confirmed</span>
                      <CitationBadge turnIds={[5, 6]} turns={mockTurns} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Transcript viewer */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <TranscriptViewer transcript={mockTranscript} />
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              <strong>Note:</strong> In the full implementation, clicking a citation badge will scroll to and highlight the referenced turns in this transcript viewer.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
