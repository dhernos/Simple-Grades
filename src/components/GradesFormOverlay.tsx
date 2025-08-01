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
        throw new Error('Fehler beim Laden der Fächer.');
      }
      const data: Subject[] = await response.json();
      setSubjects(data);
      if (data.length > 0) {
        setSelectedSubjectId(data[0].id);
      }
    } catch (err: any) {
      setError(err.message);
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
      setError("Bitte geben Sie einen Fachnamen ein.");
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
        throw new Error(errorData.error || 'Fehler beim Hinzufügen des Fachs.');
      }

      const newSubject: Subject = await response.json();
      setSubjects([...subjects, newSubject]);
      setNewSubjectName("");
      setSuccess(`Fach "${newSubject.name}" wurde hinzugefügt.`);
      setSelectedSubjectId(newSubject.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveGrade = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedSubjectId || !note || !jahr) {
      setError("Bitte wählen Sie ein Fach aus und geben Sie Note und Jahr ein.");
      return;
    }

    try {
      const response = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: selectedSubjectId, note, jahr }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Speichern der Note.');
      }

      setSuccess(`Note "${note}" für das Fach wurde gespeichert.`);
      onGradeAdded(); // Callback um die Tabelle neu zu laden
      setNote(null);
      setJahr(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-4">
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
      
      <Tabs defaultValue="add-grade" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add-grade">Note hinzufügen</TabsTrigger>
          <TabsTrigger value="add-subject">Fach hinzufügen</TabsTrigger>
        </TabsList>
        <TabsContent value="add-grade" className="mt-4">
          <form onSubmit={handleSaveGrade} className="space-y-4">
            <div>
              <Label htmlFor="subject-select" className="mb-1">Fach:</Label>
              <Select onValueChange={setSelectedSubjectId} value={selectedSubjectId} required>
                <SelectTrigger id="subject-select" className="w-full">
                  <SelectValue placeholder="Wählen Sie ein Fach" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="note-input">Note:</Label>
              <Input
                id="note-input"
                type="number"
                min="1"
                max="6"
                value={note || ''}
                onChange={(e) => setNote(parseInt(e.target.value))}
                placeholder="Note (z.B. 2)"
                required
              />
            </div>
            <div>
              <Label htmlFor="year-input">Jahr:</Label>
              <Input
                id="year-input"
                type="number"
                min="2000"
                value={jahr || ''}
                onChange={(e) => setJahr(parseInt(e.target.value))}
                placeholder="Jahr (z.B. 2024)"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Note speichern
            </Button>
          </form>
        </TabsContent>
        <TabsContent value="add-subject" className="mt-4">
          <form onSubmit={handleAddSubject} className="space-y-4">
            <div>
              <Label htmlFor="new-subject-input">Neues Fach:</Label>
              <Input
                id="new-subject-input"
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="Fachname (z.B. Mathematik)"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Fach hinzufügen
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}