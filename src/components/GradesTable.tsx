"use client";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { useEffect, useState, useRef } from "react";
import { SkeletonGradesTable } from "@/components/SkeletonGradesTable";
import { ItemDropdown } from "@/components/ItemDropdown";
import { DeleteDialog } from "@/components/DeleteDialog";
import { EditGradeDialog } from "@/components/EditGradeDialog";
import { EditSubjectDialog } from "@/components/EditSubjectDialog";

interface SubjectToEdit {
  id: string;
  name: string;
}

interface GradeData {
  id: string;
  jahr: number;
  note: number;
  subject: {
    id: string;
    name: string;
  };
}

interface SubjectData {
  id: string;
  fach: string;
  noten: GradeData[];
  durchschnitt: number;
}

interface YearData {
  jahr: number;
  subjects: SubjectData[];
  maxNoten: number;
  overallAverage: number;
}

interface SelectedItem {
  type: 'subject' | 'grade';
  id: string;
  jahr?: number;
  x: number;
  y: number;
}

export function GradesTable() {
  const [data, setData] = useState<GradeData[]>([]);
  const [yearData, setYearData] = useState<YearData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isDeletingGradesOnly, setIsDeletingGradesOnly] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [editingGrade, setEditingGrade] = useState<{ id: string; note: number; jahr: number } | null>(null);
  const [isEditSubjectDialogOpen, setIsEditSubjectDialogOpen] = useState<boolean>(false);
  const [editingSubject, setEditingSubject] = useState<SubjectToEdit | null>(null);
  const [itemTypeToDelete, setItemTypeToDelete] = useState<'subject' | 'grade' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [itemToDelete, setItemToDelete] = useState<SelectedItem | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      processDataByYear(data);
    }
  }, [data]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSelectedItem(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  async function fetchData() {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/grades`);
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const jsonData = await response.json();
      setData(jsonData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  function processDataByYear(rawData: GradeData[]) {
    const groupedByYear: { [jahr: number]: GradeData[] } = {};
    rawData.forEach((item) => {
      if (!groupedByYear[item.jahr]) {
        groupedByYear[item.jahr] = [];
      }
      groupedByYear[item.jahr].push(item);
    });

    const processedYearData: YearData[] = Object.entries(groupedByYear).map(
      ([jahrStr, yearGrades]) => {
        const jahr = parseInt(jahrStr);
        const groupedBySubject: { [fachId: string]: GradeData[] } = {};
        yearGrades.forEach((grade) => {
          if (!groupedBySubject[grade.subject.id]) {
            groupedBySubject[grade.subject.id] = [];
          }
          groupedBySubject[grade.subject.id].push(grade);
        });

        const subjects: SubjectData[] = Object.entries(groupedBySubject).map(
          ([fachId, noten]) => {
            const subjectName = noten[0].subject.name;
            const notenValues = noten.map(n => n.note);
            const durchschnitt = notenValues.reduce((sum, note) => sum + note, 0) / notenValues.length;
            const sortedNoten = [...noten].sort((a, b) => a.id.localeCompare(b.id));
            return {
              id: fachId,
              fach: subjectName,
              noten: sortedNoten,
              durchschnitt,
            };
          }
        );

        const maxNotesCount = Math.max(...subjects.map(s => s.noten.length), 0);
        let totalAverage: number = 0;
        if (subjects.length > 0) {
          totalAverage = subjects.reduce((sum, subject) => sum + subject.durchschnitt, 0) / subjects.length;
        }

        return {
          jahr,
          subjects,
          maxNoten: maxNotesCount,
          overallAverage: totalAverage,
        };
      }
    );
    setYearData(processedYearData);
  }

  const handleItemClick = (e: React.MouseEvent, type: 'subject' | 'grade', id: string, jahr?: number) => {
    e.stopPropagation();
    if (selectedItem?.id === id && selectedItem?.type === type && selectedItem?.jahr === jahr) {
      setSelectedItem(null);
    } else {
      setSelectedItem({
        type,
        id,
        jahr,
        x: e.clientX,
        y: e.clientY,
      });
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      let endpoint: string;
      const method: string = 'DELETE';

      if (itemTypeToDelete === 'subject') {
        if (isDeletingGradesOnly) {
          const params = new URLSearchParams({
            subjectId: itemToDelete?.id || '',
            year: itemToDelete?.jahr?.toString() || ''
          });
          endpoint = `/api/grades/bySubjectAndYear?${params.toString()}`;
        } else {
          endpoint = `/api/subjects/${itemToDelete?.id}`;
        }
      } else if (itemTypeToDelete === 'grade') {
        endpoint = `/api/grades/${itemToDelete?.id}`;
      } else {
        return;
      }

      const response = await fetch(endpoint, {
        method: method,
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }
      fetchData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      setItemTypeToDelete(null);
      setIsDeletingGradesOnly(false);
    }
  };

  const handleDeleteGrade = () => {
    if (selectedItem) {
      setItemTypeToDelete(selectedItem.type);
      setItemToDelete(selectedItem);
      setIsDeletingGradesOnly(false);
      setIsDeleteDialogOpen(true);
      setSelectedItem(null);
    }
  };

  const handleDeleteSubjectGradesOnly = () => {
    if (selectedItem) {
      setItemTypeToDelete('subject');
      setItemToDelete(selectedItem);
      setIsDeletingGradesOnly(true);
      setIsDeleteDialogOpen(true);
      setSelectedItem(null);
    }
  };

  const handleDeleteSubjectAndAllGrades = () => {
    if (selectedItem) {
      setItemTypeToDelete('subject');
      setItemToDelete(selectedItem);
      setIsDeletingGradesOnly(false);
      setIsDeleteDialogOpen(true);
      setSelectedItem(null);
    }
  };

  const findGradeById = (id: string) => {
    for (const grade of data) {
      if (grade.id === id) {
        return grade;
      }
    }
    return null;
  };

  const handleSaveGrade = async (id: string, note: number, jahr: number) => {
    try {
      const response = await fetch(`/api/grades/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note, jahr }),
      });

      if (!response.ok) {
        throw new Error("Failed to update grade");
      }
      fetchData();
      setIsEditDialogOpen(false);
      setEditingGrade(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSaveSubject = async (id: string, newName: string) => {
    try {
      const response = await fetch(`/api/subjects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      });
      if (!response.ok) {
        throw new Error("Failed to update subject");
      }
      fetchData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsEditSubjectDialogOpen(false);
      setEditingSubject(null);
    }
  };

  const findSubjectById = (id: string) => {
    for (const yearEntry of yearData) {
      const subject = yearEntry.subjects.find(s => s.id === id);
      if (subject) {
        return { id: subject.id, name: subject.fach };
      }
    }
    return null;
  };

  const handleEditItem = () => {
    if (!selectedItem) return;
    setSelectedItem(null);

    if (selectedItem.type === 'grade') {
      const gradeToEdit = findGradeById(selectedItem.id);
      if (gradeToEdit) {
        setEditingGrade(gradeToEdit);
        setIsEditDialogOpen(true);
      }
    } else if (selectedItem.type === 'subject') {
      const subjectToEdit = findSubjectById(selectedItem.id);
      if (subjectToEdit) {
        setEditingSubject(subjectToEdit);
        setIsEditSubjectDialogOpen(true);
      }
    }
  };

  useEffect(() => {
    if (selectedItem && dropdownRef.current) {
      const dropdownElement = dropdownRef.current;
      const dropdownWidth = dropdownElement.offsetWidth;
      const dropdownHeight = dropdownElement.offsetHeight;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let newX = selectedItem.x;
      let newY = selectedItem.y;

      if (newX + dropdownWidth > windowWidth) {
        newX = windowWidth - dropdownWidth - 10;
      }
      if (newY + dropdownHeight > windowHeight) {
        newY = windowHeight - dropdownHeight - 10;
      }

      dropdownElement.style.top = `${newY}px`;
      dropdownElement.style.left = `${newX}px`;
    }
  }, [selectedItem]);

  if (isLoading) {
    return <SkeletonGradesTable />;
  }

  if (error) {
    return <div className="text-red-500 text-center">Error: {error}</div>;
  }

  if (yearData.length === 0) {
    return <div className="text-center">No grades yet. Add them now!</div>;
  }

  return (
    <div ref={wrapperRef} className="lg:overflow-auto overflow-x-hidden">
      {yearData.map((yearEntry) => (
        <div key={yearEntry.jahr} className="rounded-lg shadow-md p-4 mb-8">
          <h2 className="text-2xl font-bold mb-4">
            Year: {yearEntry.jahr} <span className="lg:hidden text-2xl font-bold ml-4">Ø {yearEntry.overallAverage.toFixed(2)}</span>
          </h2>

          <div className="hidden lg:block">
            <Table className="min-w-full table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/4 text-left">Subject</TableHead>
                  {Array.from({ length: yearEntry.maxNoten }, (_, i) => (
                    <TableHead key={`note-header-${i}`} className="w-auto text-right">Grade {i + 1}</TableHead>
                  ))}
                  <TableHead className="w-1/4 text-right">Average</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {yearEntry.subjects.map((subject) => (
                  <TableRow key={`${yearEntry.jahr}-${subject.id}`}>
                    <TableCell
                      className="text-left relative cursor-pointer"
                      onClick={(e) => handleItemClick(e, 'subject', subject.id, yearEntry.jahr)}
                    >
                      {subject.fach}
                    </TableCell>
                    {Array.from({ length: yearEntry.maxNoten }).map((_, i) => {
                      const grade = subject.noten[i];
                      return (
                        <TableCell
                          key={`${subject.id}-note-${i}`}
                          className="text-right relative cursor-pointer"
                          onClick={(e) => {
                            if (grade) {
                              handleItemClick(e, 'grade', grade.id);
                            }
                          }}
                        >
                          {grade?.note !== undefined ? grade.note : "-"}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right">{subject.durchschnitt.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell className="text-left">Yearly average</TableCell>
                  {Array.from({ length: yearEntry.maxNoten }).map((_, i) => (
                    <TableCell key={`total-avg-filler-${i}`} className="text-right"></TableCell>
                  ))}
                  <TableCell className="text-right">{yearEntry.overallAverage.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="lg:hidden">
            {yearEntry.subjects.map((subject) => (
              <div key={`${yearEntry.jahr}-${subject.id}`} className="rounded-md p-4 mb-4">
                <div
                  className="font-semibold text-lg mb-2 cursor-pointer"
                  onClick={(e) => handleItemClick(e, 'subject', subject.id, yearEntry.jahr)}
                >
                  {subject.fach}
                </div>
                <div className="flex flex-col gap-1 text-sm">
                  {subject.noten.map((grade, i) => (
                    <div key={grade.id} className="flex justify-between items-center py-1">
                      <span className="font-medium">Grade {i + 1}:</span>
                      <span
                        className="cursor-pointer"
                        onClick={(e) => handleItemClick(e, 'grade', grade.id)}
                      >
                        {grade.note}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center border-t mt-2 pt-2 font-bold">
                  <span>Average:</span>
                  <span>{subject.durchschnitt.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {selectedItem && (
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: selectedItem.y,
            left: selectedItem.x,
            zIndex: 1000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <ItemDropdown
            type={selectedItem.type}
            onEdit={handleEditItem}
            onDeleteGradesOnly={handleDeleteSubjectGradesOnly}
            onDeleteSubject={handleDeleteSubjectAndAllGrades}
            onDeleteGrade={handleDeleteGrade}
          />
        </div>
      )}

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDeleteDialogOpen(false);
            setItemToDelete(null);
            setItemTypeToDelete(null);
            setIsDeletingGradesOnly(false);
          }
        }}
        onConfirm={handleDeleteItem}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setItemToDelete(null);
          setItemTypeToDelete(null);
          setIsDeletingGradesOnly(false);
        }}
        itemType={itemTypeToDelete || ''}
        isDeletingGradesOnly={isDeletingGradesOnly}
      />
      {editingGrade && (
        <EditGradeDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSave={handleSaveGrade}
          gradeId={editingGrade.id}
          initialNote={editingGrade.note}
          initialJahr={editingGrade.jahr}
        />
      )}
      {editingSubject && (
        <EditSubjectDialog
          isOpen={isEditSubjectDialogOpen}
          onClose={() => setIsEditSubjectDialogOpen(false)}
          onSave={handleSaveSubject}
          subjectId={editingSubject.id}
          initialName={editingSubject.name}
        />
      )}
    </div>
  );
}