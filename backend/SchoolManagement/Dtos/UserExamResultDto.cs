namespace SchoolManagement.Dtos
{
    public class UserExamResultDto
    {
        public int ExamId { get; set; }
        public string ExamName { get; set; }
        public double Score { get; set; }
        public double NetScore { get; set; }
        public double PositiveScore { get; set; }
        public double NegativePenalty { get; set; }
        public bool IsPassed { get; set; }
        public DateTime SubmittedAt { get; set; }
        public int CorrectAnswers { get; set; }
        public int TotalQuestions { get; set; }
    }
}
