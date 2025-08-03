/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Noten` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Noten" DROP CONSTRAINT "Noten_subjectId_fkey";

-- AlterTable
ALTER TABLE "Noten" DROP COLUMN "createdAt";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT;

-- AddForeignKey
ALTER TABLE "Noten" ADD CONSTRAINT "Noten_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
