# Database Design - Legal Intake Form System

## Overview
This document outlines the database schema for a legal intake form system that allows lawyers to capture and manage client information for legal matters derived from transcript calls.

## Technology Stack
- **ORM**: Drizzle ORM
- **Database**: SQLite (via better-sqlite3)
- **Schema Location**: `db/schema.ts`

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

### 4. Open Questions
1. **Cascade Behavior**: What should happen to `intake_form_data` when a `matter` is deleted?
2. ~~**Liability Structure**: What fields should the liability JSON contain?~~ ✅ Resolved
3. ~~**Damages Structure**: What fields should the damages JSON contain?~~ ✅ Resolved
4. **Evidence Structure**: What specific fields should the Evidence type contain?
5. **Validation**: Should case_type validation be at DB level (CHECK constraint) or app level only?
6. **Soft Deletes**: Do matters need soft deletion (deleted_at timestamp)?
7. **Audit Trail**: Do we need to track who created/modified records?

## Next Steps
1. ✅ Review and approve data model design
2. ✅ Define JSON schemas for `liability` and `damages` fields
3. ⏳ Implement schema in `db/schema.ts` using Drizzle ORM
4. ⏳ Create Zod validation schemas
5. ⏳ Generate and run migrations
6. ⏳ Update seed data if needed
