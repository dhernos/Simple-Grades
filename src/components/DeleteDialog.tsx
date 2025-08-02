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
}

export function DeleteDialog({ isOpen, onCancel, onConfirm, itemType }: DeleteDialogProps) {
  const isSubject = itemType === 'subject';
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sind Sie sich sicher?</AlertDialogTitle>
          <AlertDialogDescription>
            {isSubject
              ? "Diese Aktion kann nicht rückgängig gemacht werden. Dies wird das Fach und alle zugehörigen Noten permanent löschen."
              : "Diese Aktion kann nicht rückgängig gemacht werden. Dies wird die ausgewählte Note permanent löschen."
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-500 hover:bg-red-600">
            {isSubject ? "Fach löschen" : "Note löschen"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}