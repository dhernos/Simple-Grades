-- Copyright (C) 2025 github.com/dhernos
--
-- SPDX-License-Identifier: AGPL-3.0-or-later

-- AlterTable
ALTER TABLE "Noten" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
