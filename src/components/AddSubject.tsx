"use client"

import { useState, FormEvent } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface Subject {
  id: string
  name: string
}

export function AddSubject({ onSubjectAdded }: { onSubjectAdded?: () => void }) {
  const [newSubjectName, setNewSubjectName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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
      setNewSubjectName("");
      setSuccess(`Fach "${newSubject.name}" wurde hinzugefügt.`);
      
      // Callback aufrufen, falls vorhanden
      if (onSubjectAdded) {
        onSubjectAdded();
      }
      
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-4">
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
      
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
    </div>
  );
}