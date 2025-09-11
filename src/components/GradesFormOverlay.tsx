// Copyright (C) 2025 github.com/dhernos
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client"

import { useState, useEffect, FormEvent } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Subject {
  id: string
  name: string
}

export function GradesFormOverlay({ onGradeAdded }: { onGradeAdded: () => void }) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [newSubjectName, setNewSubjectName] = useState("")
  const [selectedSubjectId, setSelectedSubjectId] = useState("")
  const [note, setNote] = useState<number | null>(null)
  const [jahr, setJahr] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/subjects');
      if (!response.ok) {
        throw new Error('Error Fetching Subjects.');
      }
      const data: Subject[] = await response.json();
      setSubjects(data);
      if (data.length > 0) {
        setSelectedSubjectId(data[0].id);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleAddSubject = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newSubjectName) {
      setError("Please enter a subject name.");
      return;
    }

    try {
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSubjectName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error adding the subject.');
      }

      const newSubject: Subject = await response.json();
      setSubjects([...subjects, newSubject]);
      setNewSubjectName("");
      setSuccess(`Subject "${newSubject.name}" added.`);
      setSelectedSubjectId(newSubject.id);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSaveGrade = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedSubjectId || !note || !jahr) {
      setError("Please fill out all fields.");
      return;
    }

    try {
      const response = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: { id: selectedSubjectId },
          note,
          jahr,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error saving grade.');
      }

      setSuccess(`Grade saved.`);
      onGradeAdded();
      setNote(null);
      setJahr(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="p-4">
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

      <Tabs defaultValue="add-grade" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add-grade" className="cursor-pointer">Add Grade</TabsTrigger>
          <TabsTrigger value="add-subject" className="cursor-pointer">Add Subject</TabsTrigger>
        </TabsList>
        <TabsContent value="add-grade" className="mt-4">
          <form onSubmit={handleSaveGrade} className="space-y-4">
            <div>
              <Label htmlFor="subject-select" className="mb-1 p-1">Subject:</Label>
              <Select onValueChange={setSelectedSubjectId} value={selectedSubjectId} required>
                <SelectTrigger id="subject-select" className="w-full cursor-pointer">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id} className="cursor-pointer">{subject.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="note-input" className="p-1">Grade:</Label>
              <Input
                id="note-input"
                type="number"
                min="0"
                value={note || ''}
                onChange={(e) => setNote(parseInt(e.target.value))}
                placeholder="Grade (e.g. 2)"
                required
              />
            </div>
            <div>
              <Label htmlFor="year-input" className="p-1">Year:</Label>
              <Input
                id="year-input"
                type="number"
                min="2000"
                value={jahr || ''}
                onChange={(e) => setJahr(parseInt(e.target.value))}
                placeholder="Year (e.g. 2024)"
                required
              />
            </div>
            <Button type="submit" className="w-full cursor-pointer">
              Save grade
            </Button>
          </form>
        </TabsContent>
        <TabsContent value="add-subject" className="mt-4">
          <form onSubmit={handleAddSubject} className="space-y-4">
            <div>
              <Label htmlFor="new-subject-input" className="pb-4">New Subject:</Label>
              <Input
                id="new-subject-input"
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="Subject (e.g. Maths)"
                required
              />
            </div>
            <Button type="submit" className="w-full cursor-pointer">
              Add Subject
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}