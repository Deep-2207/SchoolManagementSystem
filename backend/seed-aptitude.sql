USE SchoolDB;
GO

-- 1. Ensure Super Admin and Teacher roles
-- Password 'admin123' -> 'yFFabPdYSCbsBqLZSz6ILw=='
IF NOT EXISTS (SELECT 1 FROM Teacher WHERE Email = 'admin@school.edu')
BEGIN
    INSERT INTO Teacher (Name, Email, Password, IsSuperAdmin, IsActive)
    VALUES ('Super Administrator', 'admin@school.edu', 'yFFabPdYSCbsBqLZSz6ILw==', 1, 1);
END
ELSE
BEGIN
    UPDATE Teacher SET IsSuperAdmin = 1, IsActive = 1 WHERE Email = 'admin@school.edu';
END
GO

-- Ensure Alan Turing is a Teacher (not Super Admin)
UPDATE Teacher 
SET IsSuperAdmin = 0, IsActive = 1 
WHERE Email = 'teacher@school.edu';
GO

-- Add a second faculty teacher
IF NOT EXISTS (SELECT 1 FROM Teacher WHERE Email = 'shannon@school.edu')
BEGIN
    DECLARE @CeDeptId INT = (SELECT TOP 1 Id FROM Department WHERE Name = 'Computer Engineering');
    INSERT INTO Teacher (Name, Email, Password, IsSuperAdmin, IsActive, DepartmentId)
    VALUES ('Prof. Claude Shannon', 'shannon@school.edu', 'yFFabPdYSCbsBqLZSz6ILw==', 0, 1, @CeDeptId);
END
GO

-- 2. Update existing exam with video & aptitude tags if not already set
UPDATE Exam 
SET HasLiveVideo = 1, 
    VideoIframeUrl = 'https://www.youtube.com/embed/jfKfPfyJRdk', 
    VideoInstructions = 'Academy Examination Hall Proctoring Feed is active. Keep your desk clear.',
    EnableNegativeMarking = 1
WHERE Name = 'Midterm 1 - Algorithms & Complexity';
GO

-- Update existing 5 questions with Section, Difficulty, and step-by-step explanation
UPDATE ExamQuestion 
SET Section = 4, Difficulty = 2, PositiveMarks = 4, NegativeMarks = 1,
    Explanation = 'In a balanced Binary Search Tree (AVL tree), the height h is strictly bounded by O(log n). Therefore, the worst-case search path from root to leaf visits at most O(log n) nodes.'
WHERE Question LIKE '%AVL tree%';

UPDATE ExamQuestion 
SET Section = 4, Difficulty = 1, PositiveMarks = 4, NegativeMarks = 1,
    Explanation = 'A Stack operates strictly under the LIFO (Last-In, First-Out) principle, where the most recently inserted item is the first one popped. In contrast, a Queue is FIFO.'
WHERE Question LIKE '%Last-In, First-Out%';

UPDATE ExamQuestion 
SET Section = 4, Difficulty = 2, PositiveMarks = 4, NegativeMarks = 1,
    Explanation = 'Big O notation (O) provides an asymptotic upper bound on the running time of an algorithm, meaning f(n) <= c * g(n) for all n >= n0. Big Omega provides the lower bound.'
WHERE Question LIKE '%asymptotic notation%';

UPDATE ExamQuestion 
SET Section = 4, Difficulty = 1, PositiveMarks = 4, NegativeMarks = 1,
    Explanation = 'With a well-distributed hash function and constant load factor alpha = n/m, the expected number of elements in each chain is O(1), leading to average O(1) lookup time.'
WHERE Question LIKE '%separate chaining%';

UPDATE ExamQuestion 
SET Section = 4, Difficulty = 2, PositiveMarks = 4, NegativeMarks = 1,
    Explanation = 'Dijkstra algorithm uses a priority queue (min-heap) to greedily determine the shortest paths from a single source vertex to all other vertices with non-negative edge weights in O((V + E) log V).'
WHERE Question LIKE '%Dijkstra%';
GO

-- 3. Create the flagship "National Aptitude & Logic Assessment (NATA-2026)"
DECLARE @CourseId INT = (SELECT TOP 1 Id FROM Course WHERE Name = 'Data Structures & Algorithms');

IF NOT EXISTS (SELECT 1 FROM Exam WHERE Name = 'National Aptitude & Logic Assessment (NATA-2026)')
BEGIN
    INSERT INTO Exam (Name, ExamDateStart, ExamDateEnd, PassPoint, DurationMinutes, CourseId, HasLiveVideo, VideoIframeUrl, VideoInstructions, EnableNegativeMarking)
    VALUES (
        'National Aptitude & Logic Assessment (NATA-2026)',
        DATEADD(day, -1, GETDATE()),
        DATEADD(day, 14, GETDATE()),
        50,
        30,
        @CourseId,
        1,
        'https://www.youtube.com/embed/jfKfPfyJRdk',
        'Official Academy Assessment Proctor. Please remain focused on the question paper.',
        1
    );

    DECLARE @NewExamId INT = SCOPE_IDENTITY();

    -- QUANTITATIVE APTITUDE (Section 1)
    INSERT INTO ExamQuestion (ExamId, Section, Difficulty, PositiveMarks, NegativeMarks, Question, ChoiceA, ChoiceB, ChoiceC, ChoiceD, ChoiceE, TrueChoice, Explanation)
    VALUES (
        @NewExamId, 1, 1, 4, 1,
        'A train running at 54 km/hr crosses a bridge of length 250 meters in 30 seconds. What is the length of the train in meters?',
        '150 meters', '200 meters', '250 meters', '300 meters', '180 meters',
        2,
        'Step 1: Convert speed from km/hr to m/s: Speed = 54 * (5/18) = 15 m/s.\nStep 2: Total distance covered in 30 s = Speed * Time = 15 * 30 = 450 meters.\nStep 3: Distance = Length of Train (L) + Length of Bridge (250m).\nTherefore: L = 450 - 250 = 200 meters.'
    );

    INSERT INTO ExamQuestion (ExamId, Section, Difficulty, PositiveMarks, NegativeMarks, Question, ChoiceA, ChoiceB, ChoiceC, ChoiceD, ChoiceE, TrueChoice, Explanation)
    VALUES (
        @NewExamId, 1, 2, 4, 1,
        'A shopkeeper marks an article 40% above the cost price and then allows a discount of 25% on the marked price. What is his net profit or loss percentage?',
        '5% Profit', '5% Loss', '10% Profit', '15% Profit', 'No Profit No Loss',
        1,
        'Let Cost Price (CP) = 100.\nMarked Price (MP) = 100 + 40% = 140.\nDiscount = 25% of 140 = 35.\nSelling Price (SP) = 140 - 35 = 105.\nProfit = SP - CP = 105 - 100 = 5.\nProfit % = (5/100) * 100 = 5% Profit.'
    );

    INSERT INTO ExamQuestion (ExamId, Section, Difficulty, PositiveMarks, NegativeMarks, Question, ChoiceA, ChoiceB, ChoiceC, ChoiceD, ChoiceE, TrueChoice, Explanation)
    VALUES (
        @NewExamId, 1, 3, 4, 1,
        'Two pipes A and B can fill a cistern in 12 minutes and 16 minutes respectively. If both pipes are opened together, after how many minutes should pipe B be turned off so that the tank is completely full in 9 minutes?',
        '3 minutes', '4 minutes', '5 minutes', '6 minutes', '4.5 minutes',
        2,
        'Let cistern capacity = LCM(12, 16) = 48 units.\nEfficiency of pipe A = 48/12 = 4 units/min.\nEfficiency of pipe B = 48/16 = 3 units/min.\nPipe A runs for the entire 9 minutes: Work done by A = 4 * 9 = 36 units.\nRemaining work for pipe B = 48 - 36 = 12 units.\nTime pipe B was open = 12 / 3 = 4 minutes.'
    );

    -- LOGICAL REASONING (Section 2)
    INSERT INTO ExamQuestion (ExamId, Section, Difficulty, PositiveMarks, NegativeMarks, Question, ChoiceA, ChoiceB, ChoiceC, ChoiceD, ChoiceE, TrueChoice, Explanation)
    VALUES (
        @NewExamId, 2, 1, 4, 1,
        'Find the next number in the series: 7, 10, 16, 25, 37, ?',
        '50', '52', '54', '48', '56',
        2,
        'Look at the consecutive differences:\n10 - 7 = 3\n16 - 10 = 6\n25 - 16 = 9\n37 - 25 = 12\nThe sequence of differences is 3, 6, 9, 12... which increases by 3 each step (multiples of 3).\nThe next difference is 15.\nNext term = 37 + 15 = 52.'
    );

    INSERT INTO ExamQuestion (ExamId, Section, Difficulty, PositiveMarks, NegativeMarks, Question, ChoiceA, ChoiceB, ChoiceC, ChoiceD, ChoiceE, TrueChoice, Explanation)
    VALUES (
        @NewExamId, 2, 2, 4, 1,
        'Pointing to a photograph, a woman says: "He is the son of the only brother of my father-in-law." How is the man in the photograph related to the woman''s husband?',
        'Brother', 'Cousin', 'Uncle', 'Nephew', 'Father',
        2,
        'Step 1: Woman''s father-in-law''s only brother = Her husband''s uncle.\nStep 2: The son of her husband''s uncle = Her husband''s cousin.\nTherefore, the man in the photo is the cousin of the woman''s husband.'
    );

    INSERT INTO ExamQuestion (ExamId, Section, Difficulty, PositiveMarks, NegativeMarks, Question, ChoiceA, ChoiceB, ChoiceC, ChoiceD, ChoiceE, TrueChoice, Explanation)
    VALUES (
        @NewExamId, 2, 3, 4, 1,
        'Statements:\nI. All mathematicians are analytical.\nII. Some analytical thinkers are creative.\nConclusions:\n1. Some creative people are mathematicians.\n2. All analytical thinkers are mathematicians.\nWhich conclusion logically follows?',
        'Only 1 follows', 'Only 2 follows', 'Both 1 and 2 follow', 'Neither 1 nor 2 follows', 'Either 1 or 2 follows',
        4,
        'Syllogism analysis:\nPremise I: Mathematician is a subset of Analytical.\nPremise II: Analytical overlaps with Creative.\nFrom this, Creative may or may not overlap with Mathematician. Hence, conclusion 1 cannot be asserted with certainty.\nConclusion 2 is invalid because Analytical is the broader superset, not all Analytical thinkers are Mathematicians.\nHence, neither conclusion 1 nor 2 follows.'
    );

    -- VERBAL ABILITY (Section 3)
    INSERT INTO ExamQuestion (ExamId, Section, Difficulty, PositiveMarks, NegativeMarks, Question, ChoiceA, ChoiceB, ChoiceC, ChoiceD, ChoiceE, TrueChoice, Explanation)
    VALUES (
        @NewExamId, 3, 1, 4, 1,
        'Select the antonym for the word: "EPHEMERAL"',
        'Transient', 'Perpetual', 'Fleeting', 'Momentary', 'Ethereal',
        2,
        '"Ephemeral" means lasting for a very short time (transient, fleeting).\nThe opposite (antonym) is "Perpetual", which means enduring forever or everlasting.'
    );

    INSERT INTO ExamQuestion (ExamId, Section, Difficulty, PositiveMarks, NegativeMarks, Question, ChoiceA, ChoiceB, ChoiceC, ChoiceD, ChoiceE, TrueChoice, Explanation)
    VALUES (
        @NewExamId, 3, 2, 4, 1,
        'Choose the grammatically correct sentence:',
        'Neither of the two candidates have submitted their portfolio.',
        'Neither of the two candidates has submitted his or her portfolio.',
        'Neither of the two candidate has submitted their portfolio.',
        'Neither the candidates has submitted their portfolio.',
        'Neither of the two candidates are submitting portfolio.',
        2,
        '"Neither" is a singular distributive pronoun that governs a singular verb ("has") and singular referent ("his or her"). Option B correctly preserves subject-verb agreement.'
    );

    INSERT INTO ExamQuestion (ExamId, Section, Difficulty, PositiveMarks, NegativeMarks, Question, ChoiceA, ChoiceB, ChoiceC, ChoiceD, ChoiceE, TrueChoice, Explanation)
    VALUES (
        @NewExamId, 3, 3, 4, 1,
        'Complete the analogy:\nENERVATE : VIGOR :: ? : ?',
        'substantiate : proof',
        'debilitate : weakness',
        'intimidate : courage',
        'appease : tranquility',
        'amplify : volume',
        3,
        'The relationship is antonymous / privative: to "enervate" is to deprive someone of "vigor".\nSimilarly, to "intimidate" is to deprive someone of "courage" (or lessen their courage).\nOptions A and B represent reinforcements or synonyms, not deprivation.'
    );
END
GO
