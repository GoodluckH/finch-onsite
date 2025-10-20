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
Stores liability information for the legal matter.

**Structure**:
```typescript
{
  content: string;              // Required - Markdown-formatted string (typically bulleted lists)
  hasPoliceReport: boolean;     // Required - Whether a police report exists
  evidence?: Evidence[];        // Optional - Array of evidence items
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

**Content Field Format**:
- The `content` field stores **markdown-formatted text**
- Typically structured as bulleted lists for clarity
- AI will generate content in markdown format from transcript analysis
- Frontend must render markdown properly (requires markdown parser)
- Example:
  ```markdown
  - Client was driving south on Main St at approximately 35mph
  - Defendant ran red light at intersection of Main St and 5th Ave
  - Weather conditions were clear, no visibility issues
  - Client had right of way at time of collision
  ```

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
  clientCoverageDetails?: string;               // Additional client coverage details (text)

  otherPartyHasInsurance: boolean | null;       // Other party's insurance status (null if unknown)
  otherPartyInsuranceProvider?: string;         // Other party's insurance company name
  otherPartyPolicyNumber?: string;              // Other party's policy number
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
- UI should visually distinguish between "No" and "Unknown/Not mentioned"
- Policy limits stored as string to support various formats
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

## AI Integration & Transcript Processing (Planned)

### Transcript Upload Flow
1. Lawyer navigates to matter detail page
2. Clicks "Upload Transcript" button
3. File upload modal appears (supports .txt, .docx, .pdf, etc.)
4. Transcript is uploaded and processed by AI
5. AI extracts structured data and populates intake form fields
6. Lawyer reviews AI-generated content and makes manual edits as needed

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

### Database Schema Enhancements (Future)

To support audit trail and AI integration, the following schema changes will be needed:

**Enhanced Intake Form Data**:
- Add `last_ai_processed_at` timestamp to track when AI last populated fields
- Add `last_manual_edit_at` timestamp to track manual edits
- Add `data_source` field to track predominant source ('ai_generated', 'manual_entry', 'mixed')
- Store transcript content/metadata directly in matter or intake_form_data (no separate table needed initially)

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

**Note**: Transcript files will be stored as uploaded files with metadata tracked in the matter or intake form data, rather than a dedicated transcripts table. This keeps the initial implementation simpler while still supporting the core workflow.

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
