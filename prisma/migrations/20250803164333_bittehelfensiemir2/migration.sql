-- Copyright (C) 2025 github.com/dhernos
--
-- SPDX-License-Identifier: AGPL-3.0-or-later

-- DropForeignKey
ALTER TABLE "public"."Noten" DROP CONSTRAINT "Noten_subjectId_fkey";

-- AlterTable
ALTER TABLE "public"."Noten" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "public"."Noten" ADD CONSTRAINT "Noten_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
