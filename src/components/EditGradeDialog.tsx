"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditGradeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, note: number, jahr: number) => void;
  gradeId: string;
  initialNote: number;
  initialJahr: number;
}

export function EditGradeDialog({ isOpen, onClose, onSave, gradeId, initialNote, initialJahr }: EditGradeDialogProps) {
  const [note, setNote] = useState<number>(initialNote);
  const [jahr, setJahr] = useState<number>(initialJahr);

  useEffect(() => {
    setNote(initialNote);
    setJahr(initialJahr);
  }, [initialNote, initialJahr]);

  const handleSave = () => {
    onSave(gradeId, note, jahr);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit grade</DialogTitle>
          <DialogDescription>
            Edit the grade or year. Select &quot;Save&quot; to save your changes.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="note" className="text-right">
              Grade
            </Label>
            <Input
              id="note"
              type="number"
              value={note}
              onChange={(e) => setNote(parseInt(e.target.value))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="jahr" className="text-right">
              Year
            </Label>
            <Input
              id="jahr"
              type="number"
              value={jahr}
              onChange={(e) => setJahr(parseInt(e.target.value))}
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