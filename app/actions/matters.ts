"use server";

import { db } from "@/db";
import { matters, intakeFormData } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { Liability, Damages, Coverage } from "@/db/types";

export async function getMatters() {
  return await db
    .select({
      id: matters.id,
      name: matters.name,
      clientName: matters.clientName,
      createdAt: matters.createdAt,
      updatedAt: matters.updatedAt,
    })
    .from(matters);
}

export async function getMatter(id: number) {
  const result = await db
    .select({
      id: matters.id,
      name: matters.name,
      clientName: matters.clientName,
      clientDob: matters.clientDob,
      clientPhone: matters.clientPhone,
      clientEmail: matters.clientEmail,
      clientAddress: matters.clientAddress,
      incidentDate: matters.incidentDate,
      incidentLocation: matters.incidentLocation,
      createdAt: matters.createdAt,
      updatedAt: matters.updatedAt,
      intakeFormData: {
        id: intakeFormData.id,
        caseType: intakeFormData.caseType,
        liability: intakeFormData.liability,
        damages: intakeFormData.damages,
        coverage: intakeFormData.coverage,
      },
    })
    .from(matters)
    .leftJoin(intakeFormData, eq(matters.intakeFormDataId, intakeFormData.id))
    .where(eq(matters.id, id))
    .limit(1);

  return result[0] || null;
}

export async function createMatter(name: string) {
  // Create default intake form data
  const defaultLiability: Liability = {
    content: "",
    hasPoliceReport: false,
    evidence: [],
  };

  const defaultDamages: Damages = {
    severity: "low",
    indications: [],
  };

  const defaultCoverage = {
    clientHasInsurance: null,
    otherPartyHasInsurance: null,
    medicalCoverageAvailable: null,
    underinsuredMotoristCoverage: null,
  };

  const [newIntakeForm] = await db
    .insert(intakeFormData)
    .values({
      caseType: "mva",
      liability: defaultLiability,
      damages: defaultDamages,
      coverage: defaultCoverage,
    })
    .returning();

  const [newMatter] = await db
    .insert(matters)
    .values({
      name,
      intakeFormDataId: newIntakeForm.id,
    })
    .returning();

  revalidatePath("/");
  return newMatter.id;
}

export async function deleteMatter(id: number) {
  // Get the matter to find the intake form data ID
  const matter = await db
    .select({ intakeFormDataId: matters.intakeFormDataId })
    .from(matters)
    .where(eq(matters.id, id))
    .limit(1);

  if (matter[0]) {
    // Delete matter first (due to foreign key)
    await db.delete(matters).where(eq(matters.id, id));
    // Then delete intake form data
    await db
      .delete(intakeFormData)
      .where(eq(intakeFormData.id, matter[0].intakeFormDataId));
  }

  revalidatePath("/");
}

export async function updateIntakeFormData(
  id: number,
  data: {
    caseType: string;
    liability: Liability;
    damages: Damages;
    coverage: Coverage;
  }
) {
  await db
    .update(intakeFormData)
    .set({
      caseType: data.caseType,
      liability: data.liability,
      damages: data.damages,
      coverage: data.coverage,
    })
    .where(eq(intakeFormData.id, id));

  revalidatePath("/matters/[id]");
}

export async function updateMatter(
  id: number,
  data: {
    name?: string;
    clientName?: string;
    clientDob?: string;
    clientPhone?: string;
    clientEmail?: string;
    clientAddress?: string;
    incidentDate?: string;
    incidentLocation?: string;
  }
) {
  await db.update(matters).set(data).where(eq(matters.id, id));

  revalidatePath("/matters/[id]");
}
