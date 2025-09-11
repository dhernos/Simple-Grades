-- Copyright (C) 2025 github.com/dhernos
--
-- SPDX-License-Identifier: AGPL-3.0-or-later

-- DropForeignKey
ALTER TABLE "subjects" DROP CONSTRAINT "subjects_userId_fkey";

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
