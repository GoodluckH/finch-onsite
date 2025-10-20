# Design Document - Legal Intake Form System

## Overview
This document outlines the complete system design for a legal intake form system that allows lawyers to capture and manage client information for legal matters derived from transcript calls. This is a B2B product designed for professional legal workflows with emphasis on dense, efficient UI/UX.

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
  content: string;              // Required - String description of liabilities
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
2. ~~**Liability Structure**: What fields should the liability JSON contain?~~ ✅ Resolved
3. ~~**Damages Structure**: What fields should the damages JSON contain?~~ ✅ Resolved
4. **Evidence Structure**: Placeholder type with id, type, description, url (optional fields)
5. ~~**Validation**: Should case_type validation be at DB level (CHECK constraint) or app level only?~~ ✅ App-level validation via Zod
6. **Soft Deletes**: Not implemented (hard deletes for now)
7. **Audit Trail**: Basic timestamps only (created_at, updated_at on matters)

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
  - Inline create form (name field only)
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
1. User enters matter name in homepage form
2. Form submits to `createMatter` server action
3. Server creates default intake form data (MVA case, empty liability, low severity damages)
4. Server creates matter linked to intake form
5. Page revalidates, new matter appears in list

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

## Future Considerations
- Evidence management (file uploads, URLs, metadata)
- Search and filtering on matters list
- Sorting by date, name, case type
- Pagination for large matter lists
- Audit logging for compliance
- User authentication and authorization
- Export functionality (PDF, CSV)
- Advanced validation rules per case type
- Template system for common case scenarios
- Integration with external legal systems
