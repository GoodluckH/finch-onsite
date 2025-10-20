"use client";

import { useState, useRef } from "react";
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
import { processTranscriptAndCreateMatter } from "@/app/actions/transcript";

type CreationMode = "select" | "manual" | "transcript";

export function CreateMatterDialog() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CreationMode>("select");
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleTranscriptUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !transcriptFile) return;

    setIsCreating(true);
    setProcessingStatus("Reading transcript file...");

    try {
      // Read file content
      const fileContent = await transcriptFile.text();
      setProcessingStatus("Parsing JSON...");

      // Parse JSON
      const transcript = JSON.parse(fileContent);
      setProcessingStatus("Processing transcript with AI...");

      // Process with AI
      const result = await processTranscriptAndCreateMatter(name.trim(), transcript);

      if (result.success) {
        setProcessingStatus("✓ Complete!");
        setOpen(false);
        setName("");
        setTranscriptFile(null);
        setMode("select");
        setProcessingStatus("");
        router.push(`/matters/${result.matterId}`);
      }
    } catch (error) {
      console.error("Failed to process transcript:", error);
      setProcessingStatus("✗ Error processing transcript. Check console for details.");
      alert("Failed to process transcript. Please check the file format and try again.");
    } finally {
      setTimeout(() => {
        setIsCreating(false);
        if (processingStatus.startsWith("✗")) {
          setProcessingStatus("");
        }
      }, 2000);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.type !== "application/json") {
      alert("Please select a JSON file");
      return;
    }
    setTranscriptFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setMode("select");
      setName("");
      setTranscriptFile(null);
      setProcessingStatus("");
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
              onClick={() => setMode("transcript")}
              className="w-full p-3 border rounded-md hover:bg-gray-50 transition-colors text-left"
            >
              <div className="font-medium text-sm">From Transcript</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Upload transcript to auto-populate with AI
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

        {mode === "transcript" && (
          <form onSubmit={handleTranscriptUpload} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="transcript-matter-name" className="text-xs">
                Matter Name
              </Label>
              <Input
                id="transcript-matter-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter matter name"
                className="h-8 text-sm"
                autoFocus
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Transcript File (JSON)</Label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-md p-6 text-center transition-colors ${
                  isDragging
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                {transcriptFile ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-900">
                      {transcriptFile.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(transcriptFile.size / 1024).toFixed(1)} KB
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setTranscriptFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      Drag and drop JSON file here, or
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Browse Files
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/json,.json"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>

            {processingStatus && (
              <div className="text-xs text-center py-2 px-3 bg-blue-50 border border-blue-200 rounded-md">
                {processingStatus}
              </div>
            )}

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
              <Button
                type="submit"
                size="sm"
                disabled={isCreating || !transcriptFile}
              >
                {isCreating ? "Processing..." : "Process & Create"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
