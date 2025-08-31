"use client";

import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonGradesTable() {
  const years = [2023, 2024];
  const subjects = ["Mathematik", "Deutsch", "Englisch"];

  return (
    <>
      {years.map((year) => (
        <div key={year} className="rounded-lg shadow-md p-4 mb-8">
          <div className="mb-4">
            <Skeleton className="h-8 w-40" />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px] text-left"><Skeleton className="h-4 w-24" /></TableHead>
                {Array.from({ length: 4 }).map((_, i) => (
                  <TableHead key={`note-header-${i}`} className="text-center w-32"><Skeleton className="h-4 w-16" /></TableHead>
                ))}
                <TableHead className="w-40 text-right"><Skeleton className="h-4 w-20" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={`${year}-${subject}`}>
                  <TableCell className="font-medium"><Skeleton className="h-4 w-32" /></TableCell>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <TableCell key={`${subject}-note-${i}`} className="text-center">
                      <Skeleton className="h-4 w-8 mx-auto" />
                    </TableCell>
                  ))}
                  <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </>
  );
}