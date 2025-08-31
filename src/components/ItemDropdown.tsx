// src/components/ItemDropdown.tsx
import { Button } from "@/components/ui/button";

interface ItemDropdownProps {
  type: 'subject' | 'grade'; // Neu: Unterscheidet zwischen Fach und Note
  onEdit: () => void;
  onDeleteGradesOnly: () => void;
  onDeleteSubject: () => void;
  onDeleteGrade: () => void; // Neu: Callback zum Löschen einer einzelnen Note
}

export function ItemDropdown({ type, onEdit, onDeleteGradesOnly, onDeleteSubject, onDeleteGrade }: ItemDropdownProps) {
  return (
    <div className="z-10 bg-background outline-gray-500 outline-1 shadow-lg rounded-md p-1 flex flex-col gap-1 w-auto">
      <Button
        variant="ghost"
        size="sm"
        className="justify-start px-2 py-1 h-auto text-sm cursor-pointer"
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
      >
        Edit
      </Button>

      {/* Buttons für ein Fach */}
      {type === 'subject' && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start px-2 py-1 h-auto text-sm text-red-500 hover:text-red-600 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onDeleteGradesOnly(); }}
          >
            Delete row
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start px-2 py-1 h-auto text-sm text-red-500 hover:text-red-600 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onDeleteSubject(); }}
          >
            Delete subject
          </Button>
        </>
      )}

      {/* Button für eine Note */}
      {type === 'grade' && (
        <Button
          variant="ghost"
          size="sm"
          className="justify-start px-2 py-1 h-auto text-sm text-red-500 hover:text-red-600 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onDeleteGrade(); }}
        >
          Delete grade
        </Button>
      )}
    </div>
  );
}