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
});

export const matters = sqliteTable("matters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
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
});

// Relations
export const mattersRelations = relations(matters, ({ one }) => ({
  intakeFormData: one(intakeFormData, {
    fields: [matters.intakeFormDataId],
    references: [intakeFormData.id],
  }),
}));

export const intakeFormDataRelations = relations(intakeFormData, ({ one }) => ({
  matter: one(matters, {
    fields: [intakeFormData.id],
    references: [matters.intakeFormDataId],
  }),
}));
