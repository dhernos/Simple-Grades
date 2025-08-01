"use client";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { SkeletonGradesTable } from "@/components/SkeletonGradesTable";

interface GradeData {
  jahr: number;
  note: number;
  subject: {
    id: string;
    name: string;
  };
}

interface SubjectData {
  fach: string;
  noten: number[];
  durchschnitt: number;
}

interface YearData {
  jahr: number;
  subjects: SubjectData[];
  maxNoten: number;
  overallAverage: number;
}

export function GradesTable() {
  const [data, setData] = useState<GradeData[]>([]);
  const [yearData, setYearData] = useState<YearData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message);
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
        const groupedBySubject: { [fach: string]: number[] } = {};

        yearGrades.forEach((grade) => {
          if (!groupedBySubject[grade.subject.name]) {
            groupedBySubject[grade.subject.name] = [];
          }
          groupedBySubject[grade.subject.name].push(grade.note);
        });

        const subjects: SubjectData[] = Object.entries(groupedBySubject).map(
          ([fach, noten]) => {
            const durchschnitt =
              noten.reduce((sum, note) => sum + note, 0) / noten.length;
            const sortedNoten = [...noten].reverse();
            return {
              fach,
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
    <>
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
                <TableRow key={`${yearEntry.jahr}-${subject.fach}`}>
                  <TableCell className="text-left">{subject.fach}</TableCell>
                  {Array.from({ length: yearEntry.maxNoten }).map((_, i) => (
                    <TableCell key={`${subject.fach}-note-${i}`} className="text-right">
                      {subject.noten[i] !== undefined ? subject.noten[i] : "-"}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">{subject.durchschnitt.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {/* New row for Gesamtjahresdurchschnitt */}
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
    </>
  );
}