"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

type MatterPageClientProps = {
  matter: {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
  children: ReactNode;
};

export function MatterPageClient({ matter, children }: MatterPageClientProps) {
  const router = useRouter();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null
  );

  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // Check if intake form has unsaved changes by looking for the indicator
    const hasUnsavedChanges =
      document.querySelector('[data-unsaved-changes="true"]') !== null;

    if (hasUnsavedChanges) {
      setPendingNavigation("/");
      setShowConfirmDialog(true);
    } else {
      router.push("/");
    }
  };

  const handleConfirmNavigation = () => {
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
    setShowConfirmDialog(false);
    setPendingNavigation(null);
  };

  const handleCancelNavigation = () => {
    setShowConfirmDialog(false);
    setPendingNavigation(null);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="container mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleBackClick}
                >
                  ← Back
                </Button>
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

        <div className="container mx-auto px-6 py-4">{children}</div>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Unsaved Changes</DialogTitle>
            <DialogDescription className="text-xs">
              You have unsaved changes. Are you sure you want to leave this
              page? All unsaved changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelNavigation}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmNavigation}
            >
              Leave Without Saving
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
