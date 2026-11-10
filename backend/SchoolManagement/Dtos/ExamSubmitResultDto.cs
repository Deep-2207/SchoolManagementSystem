namespace SchoolManagement.Dtos
{
    public class ExamSubmitResultDto
    {
        public double Score { get; set; }
        public double NetScore { get; set; }
        public double PositiveScore { get; set; }
        public double NegativePenalty { get; set; }
        public bool IsPassed { get; set; }
        public int CorrectAnswers { get; set; }
        public int WrongAnswers { get; set; }
        public int SkippedAnswers { get; set; }
        public int TotalQuestions { get; set; }
        public List<ExamSubmitQuestionResultDto> Results { get; set; } = new();
    }

    public class ExamSubmitQuestionResultDto
    {
        public int QuestionId { get; set; }
        public int UserAnswer { get; set; }
        public int CorrectAnswer { get; set; }
        public bool IsCorrect { get; set; }
    }
}
