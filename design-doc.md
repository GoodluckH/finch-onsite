# Design Document - Legal Intake Form System

## Overview
This document outlines the complete system design for a legal intake form system that allows lawyers to capture and manage client information for legal matters derived from transcript calls. This is a B2B product designed for professional legal workflows with emphasis on dense, efficient UI/UX.

### Core Workflow
The system is designed to help lawyers decide whether to retain a client based on structured intake form data. The primary workflow involves:

1. **Matter Creation**: Lawyer creates a new matter for a potential client
2. **Transcript Upload**: Lawyer uploads a raw transcript of their conversation with the client (future feature)
3. **AI-Powered Extraction**: AI automatically populates the intake form from the transcript (future feature)
4. **Manual Review & Editing**: Lawyer reviews and edits AI-generated content as needed
5. **Retention Decision**: Lawyer makes an informed decision based on complete intake form data

This workflow supports two primary scenarios:
- **Transcript-First**: Create matter → upload transcript → AI populates form → manual review/edits
- **Manual-First**: Create matter → manually enter data → optionally upload transcript to overwrite/enhance

The system must track changes to support auditing of manual overwrites versus AI-generated content.

## Technology Stack

### Backend
- **Framework**: Next.js 15 (App Router)
- **ORM**: Drizzle ORM
- **Database**: SQLite (via better-sqlite3)
- **Validation**: Zod for runtime type validation
- **Server Actions**: Next.js Server Actions for data mutations

### Frontend
- **Framework**: React 19
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives (shadcn/ui)
- **Forms**: React Hook Form + Zod resolvers
- **Type Safety**: TypeScript 5
- **Markdown Rendering**: Will require markdown parser (e.g., react-markdown, marked) for liability content display

### File Structure
- `db/schema.ts` - Drizzle schema definitions
- `db/types.ts` - TypeScript type definitions
- `db/validation.ts` - Zod validation schemas
- `app/actions/matters.ts` - Server actions for CRUD operations
- `app/page.tsx` - Matters list homepage
- `app/matters/[id]/page.tsx` - Matter detail page
- `components/intake-form-editor.tsx` - Client-side form editor

## Data Models

### 1. Matter Table
Represents a legal case or matter being handled by the law firm, including client biographical information.

**Table Name**: `matters`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique identifier for the matter |
| name | TEXT | NOT NULL | Name/title of the legal matter |
| client_name | TEXT | NULL | Full name of the client (may be missing from transcript) |
| client_dob | TEXT | NULL | Client's date of birth in ISO format (may be missing from transcript) |
| client_phone | TEXT | NULL | Client's phone number (may be missing from transcript) |
| client_email | TEXT | NULL | Client's email address (may be missing from transcript) |
| client_address | TEXT | NULL | Client's physical address (may be missing from transcript) |
| incident_date | TEXT | NULL | Date of the incident in ISO format (may be missing from transcript) |
| incident_location | TEXT | NULL | Location where the incident occurred (may be missing from transcript) |
| brief | TEXT | NULL | AI-generated case summary (5 sentences max) |
| created_at | INTEGER | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Unix timestamp of when the matter was created |
| updated_at | INTEGER | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Unix timestamp of last update |
| intake_form_data_id | INTEGER | FOREIGN KEY → intake_form_data(id), UNIQUE | Links to the associated intake form data |

**Notes**:
- One-to-one relationship with `intake_form_data`
- Timestamps stored as Unix epoch integers (SQLite standard)
- Client biographical fields are nullable to support incomplete transcript data
- UI should clearly indicate which fields are missing or incomplete
- Date fields stored as TEXT in ISO 8601 format (YYYY-MM-DD) for simplicity

### 2. Intake Form Data Table
Stores the structured intake form responses for each matter.

**Table Name**: `intake_form_data`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique identifier for the intake form |
| case_type | TEXT | NOT NULL | Type of legal case (ENUM) |
| liability | TEXT | NOT NULL | JSON object storing liability information |
| damages | TEXT | NOT NULL | JSON object storing damages information |
| coverage | TEXT | NOT NULL | JSON object storing insurance coverage information |

**Notes**:
- SQLite doesn't have native ENUM or JSONB types, so we use TEXT with validation
- `case_type` will be validated at the application layer to enforce enum values
- `liability`, `damages`, and `coverage` will store JSON strings (parsed/validated by Zod at runtime)
- All JSON fields support nullable/optional subfields to handle incomplete transcript data

### 3. Case Type Enum
**Possible Values**:
- `dog_bites` - Dog bite incidents
- `mva` - Motor Vehicle Accidents
- `slip_and_fall` - Slip and fall incidents

**Implementation**:
```typescript
// Application-level enum (not database constraint)
const CASE_TYPES = ['dog_bites', 'mva', 'slip_and_fall'] as const;
```

### 4. JSON Field Structures

#### Liability Field (JSONB-like)
Stores liability information for the legal matter with focus on fault determination.

**Structure**:
```typescript
{
  atFault: 'client' | 'other_party' | 'shared' | 'unclear';  // Required - Who is at fault
  faultPercentages?: {                                        // Required if atFault === 'shared'
    client: number;      // 0-100
    otherParty: number;  // 0-100
  };
  rationale: string;                // Required - Markdown bulleted list justifying fault determination
  hasPoliceReport: boolean;         // Required - Whether a police report exists
  evidence?: Evidence[];            // Optional - Array of evidence items
}

// Evidence type (structure TBD)
type Evidence = {
  // Placeholder fields - to be defined
  id?: string;
  type?: string;
  description?: string;
  url?: string;
}
```

**Field Descriptions**:

**`atFault`** (Required):
- Determines who is primarily at fault for the incident
- Values:
  - `'client'` - The client is at fault
  - `'other_party'` - The other party is at fault
  - `'shared'` - Fault is shared between both parties (requires `faultPercentages`)
  - `'unclear'` - Fault cannot be clearly determined from available information

**`faultPercentages`** (Required if `atFault === 'shared'`):
- Object containing fault distribution when fault is shared
- `client`: Percentage of fault assigned to client (0-100)
- `otherParty`: Percentage of fault assigned to other party (0-100)
- Both values should sum to 100 in most cases
- Example: `{ client: 30, otherParty: 70 }` means client is 30% at fault

**`rationale`** (Required):
- Markdown-formatted bulleted list justifying the fault determination
- Should cite specific facts, evidence, and legal principles
- AI will generate from transcript analysis
- Example:
  ```markdown
  - Client had green light and right of way at intersection
  - Other party ran red light, confirmed by two witnesses
  - Police report cites other party for traffic violation
  - Weather conditions were clear, no visibility issues
  - Client was traveling at posted speed limit (35 mph)
  - Other party admits to running red light in police statement
  ```

**`hasPoliceReport`** (Required):
- Boolean indicating whether a police report was filed
- Critical for establishing official record of incident

#### Damages Field (JSONB-like)
Stores damage assessment information for the legal matter.

**Structure**:
```typescript
{
  severity: 'low' | 'medium' | 'high';  // Required - Overall damage severity
  indications: Indication[];             // Required - Array of damage indications
}

// Indication type
type Indication = {
  description: string;                   // Required - Description of the indication
  severity: 'low' | 'medium' | 'high';  // Required - Severity of this indication
  evidence?: Evidence[];                 // Optional - Array of evidence items
}
```

#### Coverage Field (JSONB-like)
Stores insurance coverage information for all parties involved in the matter.

**Structure**:
```typescript
{
  clientHasInsurance: boolean | null;           // Client's insurance status (null if unknown from transcript)
  clientInsuranceProvider?: string;             // Client's insurance company name
  clientPolicyNumber?: string;                  // Client's policy number
  clientCoverageEffectiveDate?: string;         // Coverage effective date (ISO format)
  clientCoverageExpirationDate?: string;        // Coverage expiration date (ISO format)
  clientCoverageDetails?: string;               // Additional client coverage details (text)

  otherPartyHasInsurance: boolean | null;       // Other party's insurance status (null if unknown)
  otherPartyInsuranceProvider?: string;         // Other party's insurance company name
  otherPartyPolicyNumber?: string;              // Other party's policy number
  otherPartyCoverageEffectiveDate?: string;     // Other party coverage effective date (ISO format)
  otherPartyCoverageExpirationDate?: string;    // Other party coverage expiration date (ISO format)
  otherPartyCoverageDetails?: string;           // Additional other party coverage details (text)

  medicalCoverageAvailable: boolean | null;     // Whether medical coverage (PIP, MedPay) is available
  medicalCoverageDetails?: string;              // Medical coverage details

  underinsuredMotoristCoverage: boolean | null; // UM/UIM coverage available (relevant for MVA cases)
  policyLimits?: string;                        // Known policy limits (e.g., "100/300", "25/50")

  notes?: string;                               // Additional coverage notes or special circumstances
}
```

**Coverage Field Notes**:
- Uses nullable booleans (`boolean | null`) to distinguish between "no" (false), "yes" (true), and "unknown/not mentioned in transcript" (null)
- All detail fields are optional since transcript may not contain complete information
- **Effective dates are critical**: Used to determine if coverage applies to the incident date
- Coverage dates stored as ISO format strings (YYYY-MM-DD) for consistency with incident_date
- UI should visually distinguish between "No" and "Unknown/Not mentioned"
- UI should highlight if incident date falls outside coverage period (red warning)
- Policy limits stored as string to support various formats (e.g., "100/300", "25/50/25")
- Comprehensive enough to capture common personal injury insurance scenarios
- `notes` field for edge cases or additional context from transcript

## Relationships

```
matters (1) ←→ (1) intake_form_data
```

- **One-to-One**: Each matter has exactly one intake form data record
- **Foreign Key**: `matters.intake_form_data_id` references `intake_form_data.id`
- **Cascade Behavior**: TBD (typically CASCADE on delete to maintain referential integrity)

## Design Decisions & Considerations

### 1. SQLite Limitations
- **No native ENUM**: Using TEXT with application-level validation via Zod
- **No native JSON/JSONB**: Using TEXT to store JSON strings; Drizzle can serialize/deserialize
- **Integer timestamps**: Following SQLite convention of Unix timestamps

### 2. Relationship Design
- Using one-to-one relationship between `matters` and `intake_form_data`
- Foreign key placed on `matters` table (alternative: could be on `intake_form_data`)
- UNIQUE constraint on `intake_form_data_id` ensures one-to-one integrity

### 3. Scalability Considerations
- **Indexing**: Should add index on `matters.intake_form_data_id` for join performance
- **JSON Querying**: SQLite does support JSON functions (json_extract), but limited compared to PostgreSQL's JSONB
- **Future Migration**: If JSON querying becomes critical, consider migrating to PostgreSQL

### 4. Implementation Decisions
1. ~~**Cascade Behavior**: What should happen to `intake_form_data` when a `matter` is deleted?~~ ✅ Manual cascade in server actions
2. ~~**Liability Structure**: What fields should the liability JSON contain?~~ ✅ Resolved (markdown-formatted content)
3. ~~**Damages Structure**: What fields should the damages JSON contain?~~ ✅ Resolved
4. **Evidence Structure**: Placeholder type with id, type, description, url (optional fields)
5. ~~**Validation**: Should case_type validation be at DB level (CHECK constraint) or app level only?~~ ✅ App-level validation via Zod
6. **Soft Deletes**: Not implemented (hard deletes for now)
7. **Audit Trail**: Basic timestamps only (will need enhancement for AI/manual tracking)

## Implementation Status

### Database Layer ✅
- [x] Schema design approved
- [x] Drizzle schema implemented (`db/schema.ts`)
- [x] TypeScript types created (`db/types.ts`)
- [x] Zod validation schemas created (`db/validation.ts`)
- [x] Migrations generated and applied
- [x] Database relations configured (one-to-one between matters and intake_form_data)

### Backend Layer ✅
- [x] Server actions for CRUD operations (`app/actions/matters.ts`)
  - `getMatters()` - List all matters
  - `getMatter(id)` - Get single matter with intake form data
  - `createMatter(formData)` - Create matter with default intake form
  - `deleteMatter(id)` - Delete matter and associated intake form
  - `updateIntakeFormData(id, data)` - Update intake form fields
- [x] Default data creation (auto-creates intake form on matter creation)
- [x] Manual cascade delete implementation

### Frontend Layer ✅
- [x] Homepage (`app/page.tsx`)
  - Matters list in card grid layout (3 columns desktop)
  - Modal dialog for creating matters (`components/create-matter-dialog.tsx`)
  - Delete button per card
  - Click-through navigation to detail page
- [x] Matter detail page (`app/matters/[id]/page.tsx`)
  - Clean header with matter name and timestamps
  - Back navigation button
  - Full intake form editor
- [x] Intake form editor component (`components/intake-form-editor.tsx`)
  - Case type selector
  - Liability section (content textarea, police report checkbox)
  - Damages section (severity selector, indications array)
  - Dynamic add/remove indications
  - Client-side state management
  - Save functionality with loading state

### Frontend Layer - Pending Enhancements ⏳
- [x] Markdown rendering for liability content field with edit/preview toggle
- [x] Unsaved changes tracking with visual indicator and navigation warnings
- [ ] Client biographical information section on matter detail page
- [ ] Coverage section in intake form editor
- [ ] Visual indicators for missing/incomplete fields (e.g., grayed out, "Not mentioned in transcript" label)
- [ ] Nullable field handling in UI (three-state: Yes/No/Unknown)
- [ ] Transcript upload UI and flow
- [ ] AI processing indicator/status
- [ ] Change tracking and audit trail visualization
- [ ] Diff view for AI-generated vs. manually edited content
- [ ] Confirmation dialogs for transcript overwrites

## UI/UX Design Principles

### B2B Professional Design
- **Tight Spacing**: Minimal gaps, compact layouts (p-3, gap-2, etc.)
- **Small Text**: text-sm, text-xs for dense information display
- **Compact Controls**: h-8 inputs, small buttons (size="sm")
- **Professional Colors**: Neutral grays, subtle borders, minimal decoration
- **Efficient Navigation**: Inline forms, quick actions, minimal clicks
- **Data Density**: Card grids, compact forms, efficient use of space

### Handling Missing/Incomplete Data
When data is missing from transcripts or manual entry:

**Visual Indicators**:
- Empty required fields: Red border or asterisk
- Empty optional fields: Normal styling but with placeholder "Not provided"
- Unknown boolean values (null): Three-state controls (Yes/No/Unknown)
- Missing sections: Collapsed or grayed out with "Complete this section" prompt

**Three-State Boolean Controls**:
For fields like `clientHasInsurance` that can be true/false/null:
- Radio group or segmented control: "Yes" | "No" | "Unknown"
- Default to "Unknown" (null) when data is missing from transcript
- Visually distinguish "No insurance" from "Insurance status unknown"

**Field-Level Indicators**:
- Badge showing data source: "From transcript" | "Manually entered" | "Missing"
- Timestamp: "Last updated 2 hours ago"
- Icon or color coding for completeness

**Form Validation**:
- Don't block saving on optional fields
- Warn (don't error) when saving with many null/missing fields
- Summary panel showing "X of Y fields completed"

**Workflow Prompts**:
- "Some information is missing. Would you like to contact the client for details?"
- "This field was not mentioned in the transcript. Add manually?"

### Component Sizing Standards
- **Headers**: text-lg to text-2xl (not too large)
- **Body Text**: text-sm (default)
- **Labels**: text-xs
- **Inputs**: h-8 (compact)
- **Buttons**: size="sm" with h-6 to h-8
- **Padding**: p-3 to p-4 for containers
- **Gaps**: gap-2 to gap-3 between elements
- **Cards**: p-3 with minimal rounded corners

### Form Design
- Sections use subtle borders and backgrounds (border, bg-gray-50)
- Labels above inputs with text-xs sizing
- Grouped related fields in bordered containers
- Inline actions where possible
- Dynamic arrays with add/remove buttons
- Save button prominently placed but not oversized

## Type System

### TypeScript Types (`db/types.ts`)
Pure TypeScript type definitions for use throughout the application:
```typescript
type CaseType = "dog_bites" | "mva" | "slip_and_fall"
type Severity = "low" | "medium" | "high"
type Evidence = { id?, type?, description?, url? }
type Liability = { content, hasPoliceReport, evidence? }
type Indication = { description, severity, evidence? }
type Damages = { severity, indications }
type Coverage = {
  clientHasInsurance, clientInsuranceProvider?, clientPolicyNumber?, clientCoverageDetails?,
  otherPartyHasInsurance, otherPartyInsuranceProvider?, otherPartyPolicyNumber?, otherPartyCoverageDetails?,
  medicalCoverageAvailable, medicalCoverageDetails?,
  underinsuredMotoristCoverage, policyLimits?, notes?
}
type IntakeFormData = { id, caseType, liability, damages, coverage }
type Matter = {
  id, name, clientName?, clientDob?, clientPhone?, clientEmail?, clientAddress?,
  incidentDate?, incidentLocation?, createdAt, updatedAt, intakeFormDataId
}
type MatterWithIntakeForm = Matter & { intakeFormData }
type CreateIntakeFormData = Omit<IntakeFormData, 'id'>
type CreateMatter = { name, intakeFormData, clientName?, clientDob?, ... }
```

### Zod Validation Schemas (`db/validation.ts`)
Runtime validation for data integrity:
- `CaseTypeEnum` - Validates case type values
- `SeverityEnum` - Validates severity levels
- `EvidenceSchema` - Validates evidence objects
- `LiabilitySchema` - Validates liability structure
- `IndicationSchema` - Validates indication objects
- `DamagesSchema` - Validates damages structure
- `CoverageSchema` - Validates insurance coverage structure (with nullable fields)
- `IntakeFormDataSchema` - Complete intake form validation
- `MatterCreateSchema` - Matter creation validation (with optional client fields)
- `MatterUpdateSchema` - Matter update validation for client biographical data

### Drizzle Schema (`db/schema.ts`)
Database schema with ORM mappings:
- Tables: `users`, `intakeFormData`, `matters`
- JSON mode enabled for liability, damages, and coverage fields
- Timestamp mode enabled for created_at/updated_at fields
- Text fields for client biographical data and incident details (nullable)
- Relations configured for type-safe queries
- Foreign key constraints with unique index

## Data Flow

### Creating a Matter
1. User clicks "Add Matter" button on homepage
2. Modal dialog appears prompting for matter name
3. User enters name and clicks "Create Matter"
4. Server action creates default intake form data (MVA case, empty liability, low severity damages)
5. Server creates matter linked to intake form, returns new matter ID
6. User is immediately redirected to the matter detail page to begin data entry

### Editing Intake Form
1. User navigates to matter detail page
2. Server loads matter with joined intake form data
3. Client-side editor initializes with current data
4. User edits fields (case type, liability, damages, indications)
5. User clicks Save
6. Client calls `updateIntakeFormData` server action
7. Server updates intake form in database
8. Page revalidates to show updated data

### Deleting a Matter
1. User clicks Delete on matter card
2. Form submits to `deleteMatter` server action
3. Server finds linked intake form ID
4. Server deletes matter first (foreign key constraint)
5. Server deletes orphaned intake form data
6. Page revalidates, matter removed from list

## Phase II: AI Integration & Transcript Processing

### Overview
Phase II implements AI-powered extraction from conversation transcripts using Vercel AI SDK. The system processes large transcripts by intelligently chunking them with overlap to preserve context, then uses an LLM to extract structured intake form data.

### Technology Stack
- **AI SDK**: Vercel AI SDK for LLM integration
- **Chunking**: Custom overlap-based chunking with token estimation
- **Token Estimation**: Approximate token counting for chunk size management
- **LLM Provider**: Configurable (OpenAI, Anthropic, etc.)

### Transcript Format
Transcripts are expected in JSON format with the following structure:

```json
{
  "segments": [
    {
      "speaker": 0,  // Speaker identifier (0 = lawyer, 1 = client)
      "content": "Good afternoon, Ms. Harris. This is Anthony Rodriguez..."
    },
    {
      "speaker": 1,
      "content": "Hi Anthony, I'm managing alright, thanks..."
    },
    {
      "speaker": 0,
      "content": "Of course! Carson & Pine has been handling..."
    }
    // ... continues
  ]
}
```

**Format Notes**:
- Top-level object contains `segments` array
- Each segment has:
  - `speaker`: Number (speaker identifier, could be any number)
  - `content`: String containing the spoken text
- Segments are in chronological order
- **No assumptions** are made about which speaker is the lawyer vs. client
- The LLM will infer speaker roles from conversational context and content

### Transcript Chunking Strategy

#### Problem
Large transcripts may exceed LLM context windows (e.g., 128k tokens). We need to:
1. Break transcript into manageable chunks
2. Preserve context across chunk boundaries
3. Avoid losing critical information at cut points

#### Solution: Overlapping Chunks

**Chunk Parameters**:
- `MAX_CHUNK_TOKENS`: Maximum tokens per chunk (configurable, e.g., 30000 for safety margin)
- `OVERLAP_TOKENS`: Token overlap between chunks (configurable, e.g., 2000-3000 tokens)
- `ESTIMATED_TOKENS_PER_CHAR`: ~0.25 tokens per character for estimation (rough heuristic)

**Chunking Algorithm**:
```typescript
type Transcript = {
  segments: Array<{
    speaker: number;
    content: string;
  }>;
};

function chunkTranscript(transcript: Transcript, maxChunkTokens: number, overlapTokens: number): string[] {
  // 1. Convert transcript segments to linear text representation
  const fullText = transcript.segments
    .map(seg => `[Speaker ${seg.speaker}]: ${seg.content}`)
    .join('\n\n');  // Double newline between segments for clarity

  // 2. Estimate tokens for the full text
  const estimatedTotalTokens = estimateTokens(fullText);

  // 3. If fits in single chunk, return as-is
  if (estimatedTotalTokens <= maxChunkTokens) {
    return [fullText];
  }

  // 4. Calculate chunk boundaries with overlap
  const chunks: string[] = [];
  let currentPosition = 0;

  while (currentPosition < fullText.length) {
    // Determine chunk end position
    const chunkEndPosition = findChunkEnd(
      fullText,
      currentPosition,
      maxChunkTokens
    );

    // Extract chunk
    const chunk = fullText.substring(currentPosition, chunkEndPosition);
    chunks.push(chunk);

    // Move position forward, accounting for overlap
    const overlapCharOffset = estimateCharactersForTokens(overlapTokens);
    currentPosition = chunkEndPosition - overlapCharOffset;

    // Ensure we make progress (prevent infinite loop)
    if (currentPosition <= chunks.length * 100) {
      currentPosition = chunkEndPosition;
    }
  }

  return chunks;
}

function findChunkEnd(text: string, start: number, maxTokens: number): number {
  // Estimate character position for max tokens
  const estimatedChars = Math.floor(maxTokens / ESTIMATED_TOKENS_PER_CHAR);
  let endPosition = Math.min(start + estimatedChars, text.length);

  // Find natural break point (end of speaker turn, paragraph, sentence)
  // Priority: speaker change > paragraph > sentence > word boundary
  const searchWindow = endPosition - 200; // Look back up to 200 chars

  // Try to find speaker change: \n[Speaker X]:
  const speakerMatch = text.substring(searchWindow, endPosition).lastIndexOf('\n[Speaker ');
  if (speakerMatch !== -1) {
    return searchWindow + speakerMatch;
  }

  // Try to find paragraph break
  const paragraphMatch = text.substring(searchWindow, endPosition).lastIndexOf('\n\n');
  if (paragraphMatch !== -1) {
    return searchWindow + paragraphMatch;
  }

  // Try to find sentence end
  const sentenceMatch = text.substring(searchWindow, endPosition).match(/[.!?]\s+(?=[A-Z])/);
  if (sentenceMatch && sentenceMatch.index !== undefined) {
    return searchWindow + sentenceMatch.index + 1;
  }

  // Fallback: word boundary
  const wordMatch = text.substring(searchWindow, endPosition).lastIndexOf(' ');
  if (wordMatch !== -1) {
    return searchWindow + wordMatch;
  }

  // Last resort: hard cut
  return endPosition;
}

function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token (conservative)
  return Math.ceil(text.length * ESTIMATED_TOKENS_PER_CHAR);
}
```

**Overlap Rationale**:
- Prevents context loss at boundaries
- Typical overlap: 15-20% of chunk size
- For 30k token chunks, 2-3k overlap is reasonable
- Overlap includes last few speaker turns to maintain conversational context

**Example**:
```
Chunk 1: [Position 0 to 120,000 chars] (~30k tokens)
Chunk 2: [Position 112,000 to 232,000 chars] (~30k tokens)
         ^^^^^^^^^^^^^
         8k char overlap (~2k tokens)
```

### LLM Extraction Process

#### Multi-Chunk Extraction Strategy

**Option A: Per-Chunk Extraction + Merging** (Recommended for Phase II)
1. Process each chunk independently
2. Extract intake form data from each chunk
3. Merge results using intelligent conflict resolution
4. Final validation and cleanup

**Merging Logic**:
```typescript
function mergeExtractions(extractions: IntakeFormData[]): IntakeFormData {
  // Priority: later chunks override earlier chunks (fresher context)
  // Exception: Arrays (indications, evidence) are merged/deduplicated
  // Exception: Coverage dates use earliest/latest when both present

  return extractions.reduce((merged, current) => ({
    caseType: current.caseType || merged.caseType,
    liability: {
      content: mergeLiabilityContent(merged.liability.content, current.liability.content),
      hasPoliceReport: current.liability.hasPoliceReport || merged.liability.hasPoliceReport,
      evidence: deduplicateEvidence([
        ...(merged.liability.evidence || []),
        ...(current.liability.evidence || [])
      ])
    },
    damages: {
      severity: current.damages.severity || merged.damages.severity,
      indications: deduplicateIndications([
        ...merged.damages.indications,
        ...current.damages.indications
      ])
    },
    coverage: mergeCoverage(merged.coverage, current.coverage)
  }));
}
```

**Option B: Map-Reduce Pattern** (Future optimization)
1. Extract partial data from each chunk
2. Use final LLM call to synthesize all partial extractions
3. Better handling of contradictions and context

#### LLM Prompt Design

**System Prompt**:
```
You are a legal intake assistant. Extract structured information from client-lawyer conversation transcripts.

The transcript contains multiple speakers identified by numbers (e.g., Speaker 0, Speaker 1).
You must infer from context which speaker is the lawyer and which is the client/potential client.
Extract information about the client and their legal matter.

Output valid JSON matching this schema:
{
  caseType: "dog_bites" | "mva" | "slip_and_fall",
  clientName, clientDob, clientPhone, clientEmail, clientAddress,
  incidentDate, incidentLocation,
  liability: { content (markdown), hasPoliceReport (bool), evidence (array) },
  damages: { severity, indications: [{ description, severity }] },
  coverage: {
    clientHasInsurance (bool|null), clientInsuranceProvider, clientPolicyNumber,
    clientCoverageEffectiveDate, clientCoverageExpirationDate, clientCoverageDetails,
    otherPartyHasInsurance (bool|null), otherPartyInsuranceProvider, otherPartyPolicyNumber,
    otherPartyCoverageEffectiveDate, otherPartyCoverageExpirationDate, otherPartyCoverageDetails,
    medicalCoverageAvailable (bool|null), medicalCoverageDetails,
    underinsuredMotoristCoverage (bool|null), policyLimits, notes
  }
}

Rules:
- Infer speaker roles from conversational context (questions asked, information provided, professional language, etc.)
- Use null for unknown/unmentioned fields (not empty string)
- Distinguish "no" (false) from "unknown" (null) for booleans
- Format dates as YYYY-MM-DD
- liability.content: markdown bulleted list summarizing liability facts from the client's perspective
- Case type must be one of: dog_bites, mva, slip_and_fall
- If uncertain about case type, choose most likely based on context
- Extract only information about the CLIENT, not the lawyer or law firm
```

**User Prompt (per chunk)**:
```
Extract intake information from this transcript segment.
This may be part of a larger conversation.

Transcript:
{chunk_text}

Return only valid JSON, no additional text.
```

#### AI SDK Implementation

```typescript
import { generateObject } from 'ai';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai'; // or anthropic, etc.

async function extractFromChunk(chunkText: string) {
  const result = await generateObject({
    model: openai('gpt-4o'), // or anthropic('claude-3-5-sonnet-20241022')
    schema: IntakeFormDataSchema, // Zod schema from db/validation.ts
    system: SYSTEM_PROMPT,
    prompt: `Extract intake information from this transcript segment:\n\n${chunkText}`,
  });

  return result.object;
}

async function processTranscript(transcript: Transcript): Promise<{
  intakeFormData: IntakeFormData;
  clientInfo: {
    clientName?: string;
    clientDob?: string;
    clientPhone?: string;
    clientEmail?: string;
    clientAddress?: string;
    incidentDate?: string;
    incidentLocation?: string;
  };
}> {
  // 1. Chunk transcript
  const chunks = chunkTranscript(transcript, MAX_CHUNK_TOKENS, OVERLAP_TOKENS);

  // 2. Process each chunk
  const extractions = await Promise.all(
    chunks.map(chunk => extractFromChunk(chunk))
  );

  // 3. Merge results
  const merged = mergeExtractions(extractions);

  // 4. Validate and return
  return {
    intakeFormData: IntakeFormDataSchema.parse(merged.intakeFormData),
    clientInfo: merged.clientInfo,
  };
}
```

### Transcript Upload Flow (Updated)
1. Lawyer navigates to matter detail page
2. Clicks "Upload Transcript" or uses "Add Matter → From Transcript"
3. File upload modal accepts JSON transcript file
4. **Client-side**: Parse JSON to validate format
5. **Server-side**:
   - Store raw transcript (optional: for re-processing)
   - Chunk transcript with overlap
   - Process each chunk through LLM
   - Merge extractions
   - Populate intake form fields
6. **UI shows progress**: "Processing chunk 1 of 3...", "Merging results...", "Complete!"
7. Lawyer reviews AI-generated content and makes manual edits as needed

### File Structure (Phase II Additions)

```
lib/
  ai/
    chunker.ts           - Transcript chunking logic with overlap
    token-estimator.ts   - Token counting utilities
    extractor.ts         - LLM extraction using AI SDK
    merger.ts            - Multi-chunk result merging
    prompts.ts           - System/user prompt templates

app/actions/
  transcript.ts          - Server actions for transcript processing

components/
  transcript-upload.tsx  - Upload UI with progress indicator
  extraction-preview.tsx - Preview AI-extracted data before applying
```

### Configuration

```typescript
// lib/ai/config.ts
export const AI_CONFIG = {
  MAX_CHUNK_TOKENS: 30000,        // Safe limit under most LLM windows
  OVERLAP_TOKENS: 2000,           // ~7% overlap for context preservation
  ESTIMATED_TOKENS_PER_CHAR: 0.25, // Rough heuristic (4 chars = 1 token)
  LLM_PROVIDER: 'openai',         // 'openai' | 'anthropic' | 'google'
  MODEL: 'gpt-4o',                // Model name
  TEMPERATURE: 0.1,               // Low temp for consistent extraction
  MAX_RETRIES: 2,                 // Retry failed chunks
};
```

### Error Handling & Edge Cases

**Chunk Processing Failures**:
- Retry failed chunks up to MAX_RETRIES
- Skip chunks that fail repeatedly (log warning)
- Continue with partial data from successful chunks
- Flag matter as "partially processed" in UI

**Merge Conflicts**:
- Log conflicts for user review
- Use configurable merge strategy (latest-wins, earliest-wins, manual)
- Highlight conflicting fields in UI

**Invalid JSON Output**:
- Use AI SDK's built-in schema validation
- Retry with stronger prompt if validation fails
- Fallback to null/default values for invalid fields

**Empty/Missing Data**:
- Distinguish between "not mentioned" (null) and "extraction failed" (error state)
- Show extraction confidence scores per field (future enhancement)

**Token Limit Edge Cases**:
- If single speaker turn exceeds MAX_CHUNK_TOKENS, hard-cut mid-turn
- Log warning when this occurs
- Consider increasing chunk size or using larger context model

### Data Sources & Audit Trail
The system needs to track the origin and modification history of intake form data:

**Data Source Types**:
- `ai_generated` - Initially populated by AI from transcript
- `manual_entry` - Directly entered by lawyer
- `manual_override` - AI-generated content that was manually edited

**Audit Requirements**:
- Track when data was AI-generated vs. manually entered
- Highlight fields that have been manually overridden after AI generation
- Show diff/comparison between AI-generated and current state
- Timestamp each change with source attribution
- Support "revert to AI-generated" functionality for manual overwrites

### UX Considerations for AI + Manual Workflows

**Scenario 1: Transcript-First**
- Create matter → Upload transcript immediately
- AI populates all fields
- Visual indicators show "AI-generated" status
- Lawyer reviews and edits as needed
- Edited fields show "manually reviewed" badge

**Scenario 2: Manual-First with Later Transcript**
- Create matter → Manually enter some data
- Later upload transcript
- System shows preview/diff of what AI wants to change
- Lawyer selects which AI suggestions to accept
- Confirmation dialog: "This will overwrite your manual entries. Continue?"
- Option to merge (keep manual + add AI data) vs. replace (overwrite all)

**Visual Indicators Needed**:
- Badge/icon showing data source (AI vs. Manual)
- Color coding for modified fields (e.g., yellow for AI, green for manual, orange for override)
- "Last edited by AI/User on [date]" timestamp
- Change history drawer/panel
- Diff view toggle to compare versions

**Workflow Safeguards**:
- Warning when uploading transcript to matter with existing manual data
- Preview changes before applying AI suggestions
- Undo/redo functionality
- Field-level "accept AI suggestion" vs "keep manual entry"
- Bulk accept/reject for AI suggestions

### Database Schema for Transcripts and Citations

To support transcript storage and turn-level citations, we need dedicated tables:

#### Transcripts Table
Stores the raw transcript JSON associated with each matter.

**Table Name**: `transcripts`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique identifier for the transcript |
| matter_id | INTEGER | FOREIGN KEY → matters(id), NOT NULL | Associated matter |
| content | TEXT | NOT NULL | Raw JSON transcript content |
| uploaded_at | INTEGER | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Unix timestamp of upload |

**Notes**:
- One-to-one relationship with matters (each matter can have one transcript)
- Stores the entire JSON transcript as uploaded
- Content stored as TEXT (JSON string) for SQLite compatibility

#### Turns Table
Stores individual segments (turns) from the transcript with unique IDs for citation purposes.

**Table Name**: `turns`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique identifier for the turn |
| transcript_id | INTEGER | FOREIGN KEY → transcripts(id), NOT NULL | Associated transcript |
| turn_index | INTEGER | NOT NULL | Sequential index in transcript (0-based) |
| speaker | INTEGER | NOT NULL | Speaker identifier from JSON |
| content | TEXT | NOT NULL | Spoken text content |

**Notes**:
- One-to-many relationship with transcripts (transcript has many turns)
- `turn_index` preserves original order from the segments array
- Each turn can be individually cited
- Composite index on (transcript_id, turn_index) for fast lookup

#### Citations in Intake Form Data

To track which turns contributed to each extracted field, we'll extend the JSON structures with citation metadata:

**Enhanced Liability Structure with Citations**:
```typescript
{
  content: string;              // Markdown bulleted list
  hasPoliceReport: boolean;
  evidence?: Evidence[];
  citations?: {
    content?: number[];         // Turn IDs that contributed to content
    hasPoliceReport?: number[]; // Turn IDs that mentioned police report
  };
}
```

**Enhanced Damages Structure with Citations**:
```typescript
{
  severity: 'low' | 'medium' | 'high';
  indications: Indication[];    // Each indication can have turn citations
  citations?: {
    severity?: number[];        // Turn IDs that informed severity assessment
  };
}

type Indication = {
  description: string;
  severity: 'low' | 'medium' | 'high';
  evidence?: Evidence[];
  citations?: number[];         // Turn IDs for this specific indication
}
```

**Enhanced Coverage Structure with Citations**:
```typescript
{
  // ... all existing coverage fields
  citations?: {
    clientHasInsurance?: number[];
    clientInsuranceProvider?: number[];
    clientPolicyNumber?: number[];
    otherPartyHasInsurance?: number[];
    // ... citation arrays for each field
  };
}
```

**Enhanced Client Info Structure** (on Matter):
Citations stored in a separate JSON field on the matter table:
```typescript
{
  clientName?: number[];
  clientDob?: number[];
  clientPhone?: number[];
  clientEmail?: number[];
  clientAddress?: number[];
  incidentDate?: number[];
  incidentLocation?: number[];
  caseType?: number[];
}
```

#### Relationships

```
matters (1) ←→ (0..1) transcripts
transcripts (1) ←→ (many) turns
matters (1) ←→ (1) intake_form_data
```

- **One-to-One**: Each matter can have one transcript (nullable)
- **One-to-Many**: Each transcript has many turns (segments)
- **Citation References**: Turn IDs are stored in JSON metadata within extracted fields

### Transcript Viewer UI

The matter detail page will include a beautifully formatted transcript viewer:

**Design Principles**:
- Color-coded speakers for easy visual distinction
- Clean, readable typography with comfortable line height
- Alternating subtle backgrounds for speaker changes
- Speaker labels with distinct visual treatment
- Scrollable container with fixed height
- Click-to-cite functionality (future: click a turn to see what data it contributed to)

**Color Scheme**:
- Speaker 0: Blue accent (e.g., `bg-blue-50`, `text-blue-700`)
- Speaker 1: Green accent (e.g., `bg-green-50`, `text-green-700`)
- Speaker 2: Purple accent (e.g., `bg-purple-50`, `text-purple-700`)
- Additional speakers: Cycle through color palette

**Layout**:
```
┌─────────────────────────────────────────┐
│ Raw Transcript                          │
│ ─────────────────────────────────────── │
│                                         │
│ 🔵 Speaker 0                            │
│ Good afternoon, Ms. Harris. This is...  │
│                                         │
│ 🟢 Speaker 1                            │
│ Hi Anthony, I'm managing alright...     │
│                                         │
│ 🔵 Speaker 0                            │
│ Of course! Carson & Pine has been...    │
│                                         │
└─────────────────────────────────────────┘
```

**Citation Hover Effect** (future enhancement):
- When hovering over a turn, highlight which extracted fields it contributed to
- When hovering over an extracted field, highlight the source turns in the transcript

### Apple-Quality Citation UI

Citations will be displayed inline with extracted data fields using subtle, elegant indicators:

**Citation Badge Design**:
- Small, rounded badge with turn count: "📄 2 sources"
- On hover: Expandable tooltip showing excerpts from cited turns
- Click: Scrolls transcript viewer to first cited turn
- Color-coded to match turn speaker colors

**Example UI for Liability Field**:
```
┌────────────────────────────────────────────┐
│ Liability                    📄 5 sources  │
│ ──────────────────────────────────────────│
│ - Client was driving south on Main St...  │
│ - Defendant ran red light at...           │
│                                            │
│ Police Report: ✓ Yes          📄 1 source │
└────────────────────────────────────────────┘
```

**Citation Tooltip**:
```
┌──────────────────────────────────────┐
│ Sources for this information:        │
├──────────────────────────────────────┤
│ 🔵 Speaker 0 (Turn 3)                │
│ "The light was clearly red when..."  │
│                                      │
│ 🟢 Speaker 1 (Turn 5)                │
│ "I was going about 35 mph when..."   │
│                                      │
│ [View in transcript →]               │
└──────────────────────────────────────┘
```

**Field-Level Metadata Table** (for granular audit trail):
```sql
CREATE TABLE field_changes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intake_form_data_id INTEGER NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  source_type TEXT NOT NULL, -- 'ai_generated', 'manual_entry', 'manual_override'
  changed_by TEXT,           -- User ID (when auth is implemented)
  changed_at INTEGER NOT NULL,
  FOREIGN KEY (intake_form_data_id) REFERENCES intake_form_data(id)
);
```

### AI Processing Architecture (Planned)

**Components**:
- Transcript upload service (file storage)
- AI extraction service (LLM API integration)
- Change detection and diff service
- Merge conflict resolution UI

**AI Prompt Design**:
- Extract case type (dog_bites, mva, slip_and_fall)
- Extract client biographical information (name, DOB, contact info)
- Extract incident details (date, location)
- Extract liability information as markdown bulleted lists
- Identify if police report was mentioned
- Extract damage severity and specific indications
- Extract insurance coverage information for all parties
- Distinguish between "not mentioned" (null) and "explicitly stated as no" (false)
- Flag fields with low confidence or ambiguity
- Structure output as JSON matching IntakeFormData + Matter schema

**Error Handling**:
- Handle ambiguous or missing information gracefully
- Use null for missing data, not empty strings
- Flag low-confidence extractions for manual review
- Support partial extraction (some fields populated, others null)
- Allow re-processing with different AI models/prompts
- Confidence scores per field (high/medium/low)
- Generate "Extraction Summary" showing what was/wasn't found in transcript

## Future Considerations
- **Markdown editing**: Rich text editor with markdown preview for liability content
- **Evidence management**: File uploads, URLs, metadata tracking
- **Search and filtering**: Full-text search across matters, filter by case type, date range
- **Sorting**: Multi-column sort on matters list (date, name, case type)
- **Pagination**: Virtual scrolling or pagination for large matter lists
- **Advanced audit logging**: Complete change history with user attribution
- **User authentication**: Role-based access control (admin, lawyer, paralegal)
- **Export functionality**: PDF reports, CSV exports for external systems
- **Advanced validation**: Case-type-specific validation rules and required fields
- **Template system**: Pre-filled forms for common case scenarios
- **Integration**: External legal management systems, document storage (DocuSign, Clio, etc.)
- **Notifications**: Email alerts for status changes, AI processing completion
- **Collaboration**: Comments, notes, internal discussions on matters
- **Version history**: Full rollback capability for intake form data
