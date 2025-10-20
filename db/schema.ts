import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
});

export const intakeFormData = sqliteTable("intake_form_data", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  caseType: text("case_type").notNull(), // 'dog_bites' | 'mva' | 'slip_and_fall'
  liability: text("liability", { mode: "json" }).notNull(),
  damages: text("damages", { mode: "json" }).notNull(),
  coverage: text("coverage", { mode: "json" })
    .notNull()
    .$defaultFn(() => ({
      clientHasInsurance: null,
      otherPartyHasInsurance: null,
      medicalCoverageAvailable: null,
      underinsuredMotoristCoverage: null,
    })),
});

export const matters = sqliteTable("matters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  clientName: text("client_name"),
  clientDob: text("client_dob"),
  clientPhone: text("client_phone"),
  clientEmail: text("client_email"),
  clientAddress: text("client_address"),
  incidentDate: text("incident_date"),
  incidentLocation: text("incident_location"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  intakeFormDataId: integer("intake_form_data_id")
    .notNull()
    .unique()
    .references(() => intakeFormData.id),
  citations: text("citations", { mode: "json" }), // JSON object mapping fields to turn IDs
});

export const transcripts = sqliteTable("transcripts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  matterId: integer("matter_id")
    .notNull()
    .unique()
    .references(() => matters.id),
  content: text("content", { mode: "json" }).notNull(), // Raw JSON transcript
  uploadedAt: integer("uploaded_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const turns = sqliteTable("turns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  transcriptId: integer("transcript_id")
    .notNull()
    .references(() => transcripts.id),
  turnIndex: integer("turn_index").notNull(), // Sequential index in transcript (0-based)
  speaker: integer("speaker").notNull(), // Speaker identifier from JSON
  content: text("content").notNull(), // Spoken text content
});

// Relations
export const mattersRelations = relations(matters, ({ one }) => ({
  intakeFormData: one(intakeFormData, {
    fields: [matters.intakeFormDataId],
    references: [intakeFormData.id],
  }),
  transcript: one(transcripts, {
    fields: [matters.id],
    references: [transcripts.matterId],
  }),
}));

export const intakeFormDataRelations = relations(intakeFormData, ({ one }) => ({
  matter: one(matters, {
    fields: [intakeFormData.id],
    references: [matters.intakeFormDataId],
  }),
}));

export const transcriptsRelations = relations(transcripts, ({ one, many }) => ({
  matter: one(matters, {
    fields: [transcripts.matterId],
    references: [matters.id],
  }),
  turns: many(turns),
}));

export const turnsRelations = relations(turns, ({ one }) => ({
  transcript: one(transcripts, {
    fields: [turns.transcriptId],
    references: [transcripts.id],
  }),
}));
