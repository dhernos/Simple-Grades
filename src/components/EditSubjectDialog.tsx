// Copyright (C) 2025 github.com/dhernos
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditSubjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, newName: string) => void;
  subjectId: string;
  initialName: string;
}

export function EditSubjectDialog({ isOpen, onClose, onSave, subjectId, initialName }: EditSubjectDialogProps) {
  const [name, setName] = useState<string>(initialName);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const handleSave = () => {
    onSave(subjectId, name);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Subject</DialogTitle>
          <DialogDescription>
            Edit the Subject. Select &quot;Save&quot; to save your changes.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Subject
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="cursor-pointer">Cancel</Button>
          <Button onClick={handleSave} className="cursor-pointer">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}