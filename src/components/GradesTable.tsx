"use client";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
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
  id: string; // Fügen Sie eine ID für jede Note hinzu
  jahr: number;
  note: number;
  subject: {
    id: string; // Fügen Sie eine ID für jedes Fach hinzu
    name: string;
  };
}

interface SubjectData {
  id: string;
  fach: string;
  noten: GradeData[]; // Ändern Sie dies, um GradeData-Objekte zu speichern
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
  name?: string; // Für Fachnamen
}

export function GradesTable() {
  const [data, setData] = useState<GradeData[]>([]);
  const [yearData, setYearData] = useState<YearData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [editingGrade, setEditingGrade] = useState<{ id: string; note: number; jahr: number } | null>(null);
  const [isEditSubjectDialogOpen, setIsEditSubjectDialogOpen] = useState<boolean>(false);
  const [editingSubject, setEditingSubject] = useState<SubjectToEdit | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
  if (data.length > 0) {
    processDataByYear(data);
  }
}, [data]);

async function fetchData() {
  try {
    setIsLoading(true);
    const response = await fetch(`/api/grades`); 
    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }
    const jsonData = await response.json();
    setData(jsonData);
  } catch (err: any) {
    setError(err.message);
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

  const handleItemClick = (e: React.MouseEvent, item: SelectedItem) => {
    e.stopPropagation();
    setSelectedItem(item);
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;

    try {
      const isSubject = selectedItem.type === 'subject';
      const endpoint = isSubject
        ? `/api/subjects/${selectedItem.id}` // NEUE ROUTE FÜR FÄCHER
        : `/api/grades/${selectedItem.id}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }
      window.location.reload(); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSelectedItem(null);
      setIsDeleteDialogOpen(false);
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

      // Daten neu laden, um die UI zu aktualisieren
      fetchData();
      setIsEditDialogOpen(false); // Modal schließen
      setEditingGrade(null);
    } catch (err: any) {
      setError(err.message);
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
      fetchData(); // Daten neu laden
    } catch (err: any) {
      setError(err.message);
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
    setSelectedItem(null);
  };

  if (isLoading) {
    return <SkeletonGradesTable />;
  }

  if (error) {
    return <div className="text-red-500 text-center">Fehler: {error}</div>;
  }
  
  if (yearData.length === 0) {
      return <div className="text-center text-gray-500">Noch keine Noten vorhanden. Fügen Sie über den Button eine hinzu!</div>;
  }

  return (
    <div onClick={() => setSelectedItem(null)}>
      {yearData.map((yearEntry) => (
        <div key={yearEntry.jahr} className="bg-white rounded-lg shadow-md p-4 mb-8">
          <h2 className="text-2xl font-bold mb-4">Jahr: {yearEntry.jahr}</h2>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Fach</TableHead>
                {Array.from({ length: yearEntry.maxNoten }, (_, i) => (
                  <TableHead key={`note-header-${i}`} className="text-right w-32">Note {i + 1}</TableHead>
                ))}
                <TableHead className="text-right w-32">Durchschnitt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {yearEntry.subjects.map((subject) => (
                <TableRow key={`${yearEntry.jahr}-${subject.id}`}>
                  <TableCell
                    className="text-left relative cursor-pointer hover:bg-gray-100"
                    onClick={(e) => handleItemClick(e, { type: 'subject', id: subject.id, name: subject.fach })}
                  >
                    {subject.fach}
                    {selectedItem?.type === 'subject' && selectedItem.id === subject.id && (
                      <ItemDropdown 
                        onEdit={handleEditItem}
                        onDelete={() => setIsDeleteDialogOpen(true)}
                      />
                    )}
                  </TableCell>
                  {Array.from({ length: yearEntry.maxNoten }).map((_, i) => (
                    <TableCell 
                      key={`${subject.id}-note-${i}`} 
                      className="text-right relative cursor-pointer hover:bg-gray-100"
                      onClick={(e) => {
                        const grade = subject.noten[i];
                        if (grade) {
                          handleItemClick(e, { type: 'grade', id: grade.id });
                        }
                      }}
                    >
                      {subject.noten[i]?.note !== undefined ? subject.noten[i].note : "-"}
                      {selectedItem?.type === 'grade' && selectedItem.id === subject.noten[i]?.id && (
                        <ItemDropdown
                          onEdit={handleEditItem}
                          onDelete={() => setIsDeleteDialogOpen(true)}
                        />
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">{subject.durchschnitt.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold">
                <TableCell className="text-left">Gesamtjahresdurchschnitt</TableCell>
                {Array.from({ length: yearEntry.maxNoten }).map((_, i) => (
                  <TableCell key={`total-avg-filler-${i}`} className="text-right"></TableCell>
                ))}
                <TableCell className="text-right">{yearEntry.overallAverage.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ))}
      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onConfirm={handleDeleteItem}
        onCancel={() => setIsDeleteDialogOpen(false)}
        itemType={selectedItem?.type || ''}
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