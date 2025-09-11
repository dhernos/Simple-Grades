// Copyright (C) 2025 github.com/dhernos
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AddSubject } from "@/components/AddSubject";
import { Timetable } from "@/components/Timetable";

interface Subject {
  id: string;
  name: string;
}

export default function TimetablePage() {
  const [editMode, setEditMode] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshSubjectsKey, setRefreshSubjectsKey] = useState(0);

  const fetchSubjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/subjects');
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Fächer.');
      }
      const data: Subject[] = await response.json();
      setSubjects(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [refreshSubjectsKey]);

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const handleSubjectAdded = () => {
    setRefreshSubjectsKey(prevKey => prevKey + 1);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading timetable...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        Fehler: {error}
      </div>
    );
  }

  return (
    <div className="mx-auto p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-8 space-y-4 sm:space-y-0">
        <h1 className="text-3xl sm:text-4xl font-bold">Timetable</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {editMode && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  disabled={isSaving}
                  className="w-full sm:w-auto cursor-pointer"
                >
                  Add Subject
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Subject</DialogTitle>
                </DialogHeader>
                <AddSubject onSubjectAdded={handleSubjectAdded} />
              </DialogContent>
            </Dialog>
          )}
          <Button
            onClick={toggleEditMode}
            disabled={isSaving}
            className="w-full sm:w-auto cursor-pointer"
          >
            {isSaving ? "Saving..." : editMode ? "Exit editing mode" : "Edit"}
          </Button>
        </div>
      </div>

      <Timetable editMode={editMode} subjects={subjects} setIsSaving={setIsSaving} />
    </div>
  );
}