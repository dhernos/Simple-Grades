"use client"

import { useState } from "react"
import { GradesFormOverlay } from "@/components/GradesFormOverlay"
import { GradesTable } from "@/components/GradesTable"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function GradesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const handleGradeAdded = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <div className="flex flex-col items-center p-8">
      <div className="w-full max-w-5xl text-center mb-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Your grades</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="cursor-pointer">Add grades</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add grades</DialogTitle>
              </DialogHeader>
              <GradesFormOverlay onGradeAdded={handleGradeAdded} />
            </DialogContent>
          </Dialog>
        </div>
        <GradesTable key={refreshKey} />
      </div>
    </div>
  )
}