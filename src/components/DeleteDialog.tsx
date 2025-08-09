// src/components/DeleteDialog.tsx
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
  onCancel: () => void;
  onConfirm: () => void;
  itemType: string;
  isDeletingGradesOnly?: boolean; // Neu: Hinzufügen
}

export function DeleteDialog({ isOpen, onCancel, onConfirm, itemType, isDeletingGradesOnly = false }: DeleteDialogProps) {
  const isSubject = itemType === 'subject';
  
  let descriptionText = "Diese Aktion kann nicht rückgängig gemacht werden. Dies wird die ausgewählte Note permanent löschen.";
  if (isSubject && isDeletingGradesOnly) {
    descriptionText = "Diese Aktion kann nicht rückgängig gemacht werden. Dies wird alle Noten in der ausgewählten Zeile permanent löschen, das Fach selbst bleibt jedoch erhalten.";
  } else if (isSubject) {
    descriptionText = "Diese Aktion kann nicht rückgängig gemacht werden. Dies wird das Fach und alle zugehörigen Noten permanent löschen.";
  }
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sind Sie sich sicher?</AlertDialogTitle>
          <AlertDialogDescription>
            {descriptionText}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} className="cursor-pointer">Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-500 hover:bg-red-600 cursor-pointer">
            {isSubject ? (isDeletingGradesOnly ? "Zeile löschen" : "Fach löschen") : "Note löschen"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}