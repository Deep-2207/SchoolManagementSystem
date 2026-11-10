Add-Type -AssemblyName System.Speech

$outputDir = "D:\Tatvasoft\school-management-system-main\school-management-system-main\e2e\demo-video"
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Female)
$synth.Rate = -1 # Clear, professional, broadcast presentation pacing
$synth.Volume = 100

$voiceFile = Join-Path $outputDir "lucifer_poc_voiceover.wav"
$synth.SetOutputToWaveFile($voiceFile)

$narrationText = @"
Welcome to the Lucifer Academy Academic and Examination Portal, an enterprise scholastic evaluation platform engineered with Angular, ASP.NET Core, and Docker PostgreSQL.

We begin in the Super Administrator Console. Administrators provision faculty teachers, assign academic departments, manage credential access, and maintain the institutional student directory.

Next, we switch to the Faculty Teacher Portal. Faculty members manage curriculum courses, schedule examinations, and configure competitive assessment rules. Notice the Negative Marking policy toggle, awarding positive 4 marks for correct answers, while applying a 1 mark penalty deduction for errors. Teachers can also link embedded 16 by 9 live video proctoring and lecture feeds.

Here in the Aptitude Question Bank, questions are categorized across Quantitative Aptitude, Logical Reasoning, and Verbal Ability sections. With our fast bulk upload system, faculty can paste CSV data or upload spreadsheets to instantly preview, validate, and import question choices and step-by-step mathematical explanations.

Now, let us enter the Student Classroom Portal. Candidates enjoy a personalized dashboard with their candidate credentials, course schedule, and active broadcasts. Opening the Live Classroom Wing presents a 16 by 9 embedded live player, faculty notes, multi-stream switching, and an interactive doubts discussion feed where students submit live questions and upvote peer answers.

When students enter the Examination Hall, they experience a real-time synchronized desk countdown timer and proctor stream. Every candidate choice triggers instant background auto-save to the database, guaranteeing zero lost answers. Students can mark questions for review and navigate quickly using the five-state question palette.

Finally, upon submission, candidates receive comprehensive performance intelligence. Beyond net scaled scores, the platform provides Speed versus Accuracy analytics, average time spent on correct and wrong answers, sectional accuracy breakdowns, and complete step-by-step mathematical solution keys.

Thank you for reviewing the Lucifer Academy Scholastic Aptitude and Examination Platform.
"@

$synth.Speak($narrationText)
$synth.Dispose()

Write-Output "✅ Voiceover audio generated successfully at: $voiceFile"
