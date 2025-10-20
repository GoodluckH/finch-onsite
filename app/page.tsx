import { getMatters, createMatter, deleteMatter } from "./actions/matters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function Home() {
  const matters = await getMatters();

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Matters</h1>
        <form action={createMatter} className="flex gap-2 items-end">
          <div className="flex flex-col gap-1">
            <Label htmlFor="name" className="text-xs">
              Matter Name
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="Enter matter name"
              className="h-8 text-sm"
              required
            />
          </div>
          <Button type="submit" size="sm">
            Add Matter
          </Button>
        </form>
      </div>

      {matters.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No matters yet. Add one above.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {matters.map((matter) => (
            <div
              key={matter.id}
              className="border rounded-md p-3 hover:border-gray-400 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <Link
                  href={`/matters/${matter.id}`}
                  className="flex-1 min-w-0"
                >
                  <h3 className="font-medium text-sm truncate hover:text-blue-600">
                    {matter.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(matter.createdAt).toLocaleDateString()}
                  </p>
                </Link>
                <form action={deleteMatter.bind(null, matter.id)}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                  >
                    Delete
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
