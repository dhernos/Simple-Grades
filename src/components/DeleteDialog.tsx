// Copyright (C) 2025 github.com/dhernos
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onConfirm: () => void;
  itemType: string;
  isDeletingGradesOnly?: boolean;
}

export function DeleteDialog({ isOpen, onOpenChange, onCancel, onConfirm, itemType, isDeletingGradesOnly = false }: DeleteDialogProps) {
  const isSubject = itemType === 'subject';

  let descriptionText = "This action cannot be reversed. The selected grade will be permanently deleted.";
  if (isSubject && isDeletingGradesOnly) {
    descriptionText = "This action cannot be reversed. All grades in this row will be permanently deleted.";
  } else if (isSubject) {
    descriptionText = "This action cannot be reversed. The selected subject and all of its grades will be deleted.";
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {descriptionText}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} className="cursor-pointer">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-500 hover:bg-red-600 cursor-pointer">
            {isSubject ? (isDeletingGradesOnly ? "Delete row" : "Delete subject") : "Delete grade"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}