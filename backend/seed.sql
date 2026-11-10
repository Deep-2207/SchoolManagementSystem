USE SchoolDB;
GO

-- 1. Insert Departments
IF NOT EXISTS (SELECT 1 FROM Department WHERE Name = 'Computer Engineering')
BEGIN
    INSERT INTO Department (Name) VALUES ('Computer Engineering');
    INSERT INTO Department (Name) VALUES ('Software Engineering');
END
GO

-- 2. Insert Teacher (Admin)
-- Password 'admin123' -> 'yFFabPdYSCbsBqLZSz6ILw=='
IF NOT EXISTS (SELECT 1 FROM Teacher WHERE Email = 'teacher@school.edu')
BEGIN
    INSERT INTO Teacher (Name, Email, Password)
    VALUES ('Dr. Alan Turing', 'teacher@school.edu', 'yFFabPdYSCbsBqLZSz6ILw==');
END
GO

-- 3. Insert Student
-- Password 'admin123' -> 'yFFabPdYSCbsBqLZSz6ILw=='
IF NOT EXISTS (SELECT 1 FROM Student WHERE Email = 'student@school.edu')
BEGIN
    INSERT INTO Student (Name, Number, Email, Password)
    VALUES ('Elena Rostova', '2024109', 'student@school.edu', 'yFFabPdYSCbsBqLZSz6ILw==');
END
GO

-- 4. Insert Courses
DECLARE @DeptId INT = (SELECT TOP 1 Id FROM Department WHERE Name = 'Computer Engineering');
DECLARE @TeacherId INT = (SELECT TOP 1 Id FROM Teacher WHERE Email = 'teacher@school.edu');

IF NOT EXISTS (SELECT 1 FROM Course WHERE Name = 'Data Structures & Algorithms')
BEGIN
    INSERT INTO Course (Name, Day, Time, TeacherId, DepartmentId)
    VALUES ('Data Structures & Algorithms', 'Mon & Wed', '10:00 AM', @TeacherId, @DeptId);
END

IF NOT EXISTS (SELECT 1 FROM Course WHERE Name = 'Database Management Systems')
BEGIN
    INSERT INTO Course (Name, Day, Time, TeacherId, DepartmentId)
    VALUES ('Database Management Systems', 'Tue & Thu', '02:00 PM', @TeacherId, @DeptId);
END
GO

-- 5. Enroll Student in Course
DECLARE @CourseId INT = (SELECT TOP 1 Id FROM Course WHERE Name = 'Data Structures & Algorithms');
DECLARE @StudentId INT = (SELECT TOP 1 Id FROM Student WHERE Email = 'student@school.edu');

IF NOT EXISTS (SELECT 1 FROM CourseStudent WHERE CoursesId = @CourseId AND StudentsId = @StudentId)
BEGIN
    INSERT INTO CourseStudent (CoursesId, StudentsId) VALUES (@CourseId, @StudentId);
END
GO

-- 6. Insert Exam with Questions
DECLARE @CourseId INT = (SELECT TOP 1 Id FROM Course WHERE Name = 'Data Structures & Algorithms');

IF NOT EXISTS (SELECT 1 FROM Exam WHERE Name = 'Midterm 1 - Algorithms & Complexity')
BEGIN
    INSERT INTO Exam (Name, ExamDateStart, ExamDateEnd, PassPoint, DurationMinutes, CourseId)
    VALUES ('Midterm 1 - Algorithms & Complexity', DATEADD(day, -1, GETDATE()), DATEADD(day, 7, GETDATE()), 60, 30, @CourseId);
    
    DECLARE @ExamId INT = SCOPE_IDENTITY();

    INSERT INTO ExamQuestion (ExamId, Question, TrueChoice, ChoiceA, ChoiceB, ChoiceC, ChoiceD, ChoiceE)
    VALUES (@ExamId, 'What is the worst-case time complexity of searching for an element in a balanced Binary Search Tree (AVL tree) containing n elements?', 2, 'O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n^2)');

    INSERT INTO ExamQuestion (ExamId, Question, TrueChoice, ChoiceA, ChoiceB, ChoiceC, ChoiceD, ChoiceE)
    VALUES (@ExamId, 'Which of the following data structures operates on a Last-In, First-Out (LIFO) basis?', 2, 'Queue', 'Stack', 'Binary Heap', 'Linked List', 'Hash Table');

    INSERT INTO ExamQuestion (ExamId, Question, TrueChoice, ChoiceA, ChoiceB, ChoiceC, ChoiceD, ChoiceE)
    VALUES (@ExamId, 'Which asymptotic notation represents the formal upper bound of an algorithm growth rate?', 3, 'Big Omega (Ω)', 'Big Theta (Θ)', 'Big O (O)', 'Little Omega (ω)', 'Little Theta (θ)');

    INSERT INTO ExamQuestion (ExamId, Question, TrueChoice, ChoiceA, ChoiceB, ChoiceC, ChoiceD, ChoiceE)
    VALUES (@ExamId, 'What is the time complexity of searching for a key in a hash table with separate chaining in the average case?', 1, 'O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n^2)');

    INSERT INTO ExamQuestion (ExamId, Question, TrueChoice, ChoiceA, ChoiceB, ChoiceC, ChoiceD, ChoiceE)
    VALUES (@ExamId, 'Which algorithm finds the single-source shortest paths in a directed or undirected graph with non-negative edge weights?', 1, 'Dijkstra Algorithm', 'Kruskal Algorithm', 'Prim Algorithm', 'Bellman-Ford Algorithm', 'Floyd-Warshall Algorithm');
END
GO
