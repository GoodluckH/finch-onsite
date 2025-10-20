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
Represents a legal case or matter being handled by the law firm.

**Table Name**: `matters`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique identifier for the matter |
| name | TEXT | NOT NULL | Name/title of the legal matter |
| created_at | INTEGER | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Unix timestamp of when the matter was created |
| updated_at | INTEGER | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Unix timestamp of last update |
| intake_form_data_id | INTEGER | FOREIGN KEY → intake_form_data(id), UNIQUE | Links to the associated intake form data |

**Notes**:
- One-to-one relationship with `intake_form_data`
- Timestamps stored as Unix epoch integers (SQLite standard)
- The name field could represent case title, client name, or case number

### 2. Intake Form Data Table
Stores the structured intake form responses for each matter.

**Table Name**: `intake_form_data`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique identifier for the intake form |
| case_type | TEXT | NOT NULL | Type of legal case (ENUM) |
| liability | TEXT | NOT NULL | JSON object storing liability information |
| damages | TEXT | NOT NULL | JSON object storing damages information |

**Notes**:
- SQLite doesn't have native ENUM or JSONB types, so we use TEXT with validation
- `case_type` will be validated at the application layer to enforce enum values
- `liability` and `damages` will store JSON strings (parsed/validated by Zod at runtime)

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
- [ ] Markdown rendering for liability content field (currently plain textarea)
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
type IntakeFormData = { id, caseType, liability, damages }
type Matter = { id, name, createdAt, updatedAt, intakeFormDataId }
type MatterWithIntakeForm = Matter & { intakeFormData }
type CreateIntakeFormData = Omit<IntakeFormData, 'id'>
type CreateMatter = { name, intakeFormData }
```

### Zod Validation Schemas (`db/validation.ts`)
Runtime validation for data integrity:
- `CaseTypeEnum` - Validates case type values
- `SeverityEnum` - Validates severity levels
- `EvidenceSchema` - Validates evidence objects
- `LiabilitySchema` - Validates liability structure
- `IndicationSchema` - Validates indication objects
- `DamagesSchema` - Validates damages structure
- `IntakeFormDataSchema` - Complete intake form validation
- `MatterCreateSchema` - Matter creation validation

### Drizzle Schema (`db/schema.ts`)
Database schema with ORM mappings:
- Tables: `users`, `intakeFormData`, `matters`
- JSON mode enabled for liability and damages fields
- Timestamp mode enabled for date fields
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
- Extract liability information as markdown bulleted lists
- Identify if police report was mentioned
- Extract damage severity and specific indications
- Structure output as JSON matching IntakeFormData schema

**Error Handling**:
- Handle ambiguous or missing information
- Flag low-confidence extractions for manual review
- Support partial extraction (some fields populated, others empty)
- Allow re-processing with different AI models/prompts

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
