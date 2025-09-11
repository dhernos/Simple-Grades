// Copyright (C) 2025 github.com/dhernos
//
// SPDX-License-Identifier: AGPL-3.0-or-later

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
    <div className="flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-5xl text-center mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-8 space-y-4 sm:space-y-0">
          <h1 className="text-3xl sm:text-4xl font-bold">Your grades</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="cursor-pointer flex flex-col sm:flex-row gap-2 w-full sm:w-auto">Add grades</Button>
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