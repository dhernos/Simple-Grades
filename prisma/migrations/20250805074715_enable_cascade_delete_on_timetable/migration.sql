-- DropForeignKey
ALTER TABLE "public"."TimetableCell" DROP CONSTRAINT "TimetableCell_timetableRowId_fkey";

-- AddForeignKey
ALTER TABLE "public"."TimetableCell" ADD CONSTRAINT "TimetableCell_timetableRowId_fkey" FOREIGN KEY ("timetableRowId") REFERENCES "public"."TimetableRow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
