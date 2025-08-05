-- CreateTable
CREATE TABLE "public"."TimetableRow" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TimetableRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TimetableCell" (
    "id" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "subjectId" TEXT,
    "timetableRowId" TEXT NOT NULL,

    CONSTRAINT "TimetableCell_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimetableRow_userId_idx" ON "public"."TimetableRow"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TimetableRow_userId_rowIndex_key" ON "public"."TimetableRow"("userId", "rowIndex");

-- CreateIndex
CREATE INDEX "TimetableCell_timetableRowId_idx" ON "public"."TimetableCell"("timetableRowId");

-- CreateIndex
CREATE UNIQUE INDEX "TimetableCell_timetableRowId_day_key" ON "public"."TimetableCell"("timetableRowId", "day");

-- AddForeignKey
ALTER TABLE "public"."TimetableRow" ADD CONSTRAINT "TimetableRow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TimetableCell" ADD CONSTRAINT "TimetableCell_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TimetableCell" ADD CONSTRAINT "TimetableCell_timetableRowId_fkey" FOREIGN KEY ("timetableRowId") REFERENCES "public"."TimetableRow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
