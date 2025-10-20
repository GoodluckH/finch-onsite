import { getMatter } from "@/app/actions/matters";
import { IntakeFormEditor } from "@/components/intake-form-editor";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function MatterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const matter = await getMatter(Number(id));

  if (!matter || !matter.intakeFormData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  ← Back
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold">{matter.name}</h1>
                <p className="text-xs text-muted-foreground">
                  Created {new Date(matter.createdAt).toLocaleDateString()} •
                  Updated {new Date(matter.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-4">
        <IntakeFormEditor
          intakeFormDataId={matter.intakeFormData.id}
          initialData={{
            caseType: matter.intakeFormData.caseType as string,
            liability: matter.intakeFormData.liability as any,
            damages: matter.intakeFormData.damages as any,
          }}
        />
      </div>
    </div>
  );
}
