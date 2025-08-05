"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

interface Subject {
  id: string;
  name: string;
}

interface TimetableCell {
  subjectId: string | null;
  subjectName: string | null;
}

const fixedDays = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

interface Row {
  id: string;
  label: string;
  cells: TimetableCell[];
}

interface TimetableProps {
  editMode: boolean;
  subjects: Subject[];
}

export function Timetable({ editMode, subjects }: TimetableProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [newRowLabel, setNewRowLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Lade den Stundenplan beim ersten Laden der Komponente
  useEffect(() => {
    async function loadTimetable() {
      try {
        const response = await fetch('/api/timetable');
        if (response.ok) {
          const data = await response.json();
          // Stelle sicher, dass die geladenen Daten das richtige Format haben
          if (data && data.length > 0) {
            setRows(data);
          }
        }
      } catch (error) {
        console.error("Fehler beim Laden des Stundenplans:", error);
      } finally {
        setInitialLoad(false);
      }
    }
    loadTimetable();
  }, []);

  // Speichere den Stundenplan, wenn sich die 'rows' ändern UND der Bearbeitungsmodus aktiv ist
  useEffect(() => {
    if (!initialLoad && editMode) {
      saveTimetable();
    }
  }, [rows, editMode]); // Abhängigkeit von editMode hinzufügen, um auf Änderungen zu reagieren

  const saveTimetable = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rows }),
      });
    } catch (error) {
      console.error("Fehler beim Speichern des Stundenplans:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const addRow = () => {
    if (newRowLabel.trim() === "") return;

    const newRow: Row = {
      id: `row-${Date.now()}`,
      label: newRowLabel,
      cells: Array(fixedDays.length).fill({ subjectId: null, subjectName: null }),
    };
    setRows([...rows, newRow]);
    setNewRowLabel("");
  };

  const removeRow = (id: string) => {
    setRows(rows.filter((row) => row.id !== id));
  };

  const updateCellSubject = (rowIndex: number, cellIndex: number, value: string) => {
    const newRows = [...rows];
    
    if (value === "clear-selection") {
      newRows[rowIndex].cells[cellIndex] = { subjectId: null, subjectName: null };
    } else {
      const selectedSubject = subjects.find(s => s.id === value);
      if (selectedSubject) {
        newRows[rowIndex].cells[cellIndex] = {
          subjectId: selectedSubject.id,
          subjectName: selectedSubject.name,
        };
      }
    }
    setRows(newRows);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-8">
      <div className="flex justify-end mb-4">
        {isSaving && <div className="flex items-center text-sm text-gray-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Speichern...
        </div>}
      </div>
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px] text-left">Zeit</TableHead>
            {fixedDays.map((day, index) => (
              <TableHead key={index} className="w-[120px] text-center">
                {day}
              </TableHead>
            ))}
            {editMode && <TableHead className="w-[100px] text-center">Aktion</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={fixedDays.length + (editMode ? 2 : 1)} className="h-24 text-center text-gray-500">
                {editMode ? "Fügen Sie über das Formular unten eine Zeile hinzu." : "Keine Einträge vorhanden. Wechseln Sie in den Bearbeitungsmodus, um welche hinzuzufügen."}
              </TableCell>
            </TableRow>
          )}
          {rows.map((row, rowIndex) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium text-left">{row.label}</TableCell>
              {row.cells.map((cell, cellIndex) => (
                <TableCell key={cellIndex} className="text-center">
                  {editMode ? (
                    <Select
                      onValueChange={(value) => updateCellSubject(rowIndex, cellIndex, value)}
                      value={cell.subjectId || "clear-selection"}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Fach wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clear-selection">Fach löschen</SelectItem>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    cell.subjectName
                  )}
                </TableCell>
              ))}
              {editMode && (
                <TableCell className="text-center">
                  <Button
                    variant="destructive"
                    onClick={() => removeRow(row.id)}
                  >
                    Löschen
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
          {editMode && (
            <TableRow>
              <TableCell className="font-medium">
                <Input
                  placeholder="Neue Zeilenbezeichnung"
                  value={newRowLabel}
                  onChange={(e) => setNewRowLabel(e.target.value)}
                />
              </TableCell>
              {Array(fixedDays.length).fill(null).map((_, index) => (
                <TableCell key={`placeholder-${index}`}></TableCell>
              ))}
              <TableCell className="text-center">
                <Button onClick={addRow}>Zeile hinzufügen</Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}