"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMatter } from "@/app/actions/matters";

type CreationMode = "select" | "manual" | "transcript";

export function CreateMatterDialog() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CreationMode>("select");
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      const matterId = await createMatter(name.trim());
      setOpen(false);
      setName("");
      setMode("select");
      router.push(`/matters/${matterId}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setMode("select");
      setName("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">Add Matter</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Create New Matter</DialogTitle>
          <DialogDescription className="text-xs">
            {mode === "select"
              ? "Choose how you'd like to create this matter."
              : mode === "manual"
                ? "Enter matter details manually."
                : "Upload a transcript to auto-populate the intake form."}
          </DialogDescription>
        </DialogHeader>

        {mode === "select" && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setMode("manual")}
              className="w-full p-3 border rounded-md hover:bg-gray-50 transition-colors text-left"
            >
              <div className="font-medium text-sm">Manual Entry</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Enter matter information manually
              </div>
            </button>
            <button
              type="button"
              disabled
              className="w-full p-3 border rounded-md bg-gray-50 text-gray-400 cursor-not-allowed text-left opacity-60"
            >
              <div className="font-medium text-sm">From Transcript</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Upload transcript to auto-populate (Coming soon)
              </div>
            </button>
          </div>
        )}

        {mode === "manual" && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="matter-name" className="text-xs">
                Matter Name
              </Label>
              <Input
                id="matter-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter matter name"
                className="h-8 text-sm"
                autoFocus
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMode("select")}
                disabled={isCreating}
              >
                Back
              </Button>
              <Button type="submit" size="sm" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Matter"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
