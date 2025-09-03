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

interface Subject {
  id: string;
  name: string;
}

interface TimetableCell {
  subjectId: string | null;
  subjectName: string | null;
}

const fixedDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface Row {
  id: string;
  label: string;
  cells: TimetableCell[];
}

interface TimetableProps {
  editMode: boolean;
  subjects: Subject[];
  setIsSaving: (isSaving: boolean) => void;
}

export function Timetable({ editMode, subjects, setIsSaving }: TimetableProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [newRowLabel, setNewRowLabel] = useState("");
  const [newRowSubjects, setNewRowSubjects] = useState(
    Array(fixedDays.length).fill({ subjectId: null, subjectName: null })
  );
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    async function loadTimetable() {
      try {
        const response = await fetch('/api/timetable');
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setRows(data);
          }
        }
      } catch (error) {
        console.error("Error loading timetable:", error);
      } finally {
        setInitialLoad(false);
      }
    }
    loadTimetable();
  }, []);

  useEffect(() => {
    const saveTimetable = async () => {
      setIsSaving(true);
      try {
        await fetch('/api/timetable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: rows }),
        });
      } catch (error) {
        console.error("Error saving timetable:", error);
      } finally {
        setIsSaving(false);
      }
    };
    if (!initialLoad && editMode) {
      saveTimetable();
    }
  }, [rows, editMode, initialLoad, setIsSaving]);



  const addRow = () => {
    if (newRowLabel.trim() === "") return;

    const newRow: Row = {
      id: `row-${Date.now()}`,
      label: newRowLabel,
      cells: newRowSubjects,
    };
    setRows([...rows, newRow]);
    setNewRowLabel("");
    setNewRowSubjects(
      Array(fixedDays.length).fill({ subjectId: null, subjectName: null })
    );
  };

  const removeRow = (id: string) => {
    setRows(rows.filter((row) => row.id !== id));
  };

  const updateCellSubject = (rowIndex: number, cellIndex: number, value: string) => {
    const newRows = [...rows];
    const selectedSubject = subjects.find(s => s.id === value);
    if (value === "clear-selection" || !selectedSubject) {
      newRows[rowIndex].cells[cellIndex] = { subjectId: null, subjectName: null };
    } else {
      newRows[rowIndex].cells[cellIndex] = {
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.name,
      };
    }
    setRows(newRows);
  };

  const handleNewRowSubjectChange = (dayIndex: number, value: string) => {
    const newSelection = [...newRowSubjects];
    const selectedSubject = subjects.find(s => s.id === value);
    if (value === "clear-selection" || !selectedSubject) {
      newSelection[dayIndex] = { subjectId: null, subjectName: null };
    } else {
      newSelection[dayIndex] = {
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.name,
      };
    }
    setNewRowSubjects(newSelection);
  };

  return (
    <div className="rounded-lg shadow-md mb-8">
      <Table className="min-w-max">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px] text-left">Hour</TableHead>
            {fixedDays.map((day, index) => (
              <TableHead key={index} className="w-[120px] text-center">
                {day}
              </TableHead>
            ))}
            {editMode && <TableHead className="w-[90px] text-center">Action</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={fixedDays.length + (editMode ? 2 : 1)} className="h-24 text-center text-gray-500">
                {editMode ? "Start by adding rows." : "No rows. Add them in editor mode."}
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
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue placeholder="Select Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clear-selection" className="cursor-pointer">Select Subject</SelectItem>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id} className="cursor-pointer">
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
                    className="cursor-pointer"
                  >
                    Delete
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
          {editMode && (
            <TableRow>
              <TableCell className="font-medium">
                <Input
                  placeholder="Hour"
                  value={newRowLabel}
                  onChange={(e) => setNewRowLabel(e.target.value)}
                />
              </TableCell>
              {fixedDays.map((_, index) => (
                <TableCell key={`add-cell-${index}`}>
                  <Select
                    onValueChange={(value) => handleNewRowSubjectChange(index, value)}
                    value={newRowSubjects[index].subjectId || "clear-selection"}
                  >
                    <SelectTrigger className="w-full cursor-pointer">
                      <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clear-selection" className="cursor-pointer">Subject</SelectItem>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id} className="cursor-pointer">
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              ))}
              <TableCell className="text-center">
                <Button onClick={addRow} className="cursor-pointer">Add Row</Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}