import { Button } from "@/components/ui/button";

interface ItemDropdownProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function ItemDropdown({ onEdit, onDelete }: ItemDropdownProps) {
  return (
    <div className="absolute top-1/2 -translate-y-1/2 right-0 transform translate-x-[calc(100%+8px)] z-10 bg-white shadow-lg rounded-md p-1 flex flex-col gap-1 w-24">
      <Button 
        variant="ghost" 
        size="sm" 
        className="justify-start px-2 py-1 h-auto text-sm"
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
      >
        Bearbeiten
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        className="justify-start px-2 py-1 h-auto text-sm text-red-500 hover:text-red-600"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
      >
        Löschen
      </Button>
    </div>
  );
}