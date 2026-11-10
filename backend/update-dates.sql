UPDATE "Exam" 
SET "ExamDateStart" = NOW(), 
    "ExamDateEnd" = NOW() + INTERVAL '7 days' 
WHERE "ExamDateStart" < '2000-01-01';
