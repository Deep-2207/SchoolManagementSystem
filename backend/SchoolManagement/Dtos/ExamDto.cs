using SchoolManagement.Context.Tables;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace SchoolManagement.Dtos
{
    public class ExamDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public DateTime ExamDateStart { get; set; }
        public DateTime ExamDateEnd { get; set; }
        public int CourseId { get; set; }
        public CourseDto Course { get; set; }
        public decimal PassPoint { get; set; }
        public int DurationMinutes { get; set; }
        public bool HasLiveVideo { get; set; }
        public string? VideoIframeUrl { get; set; }
        public string? VideoInstructions { get; set; }
        public bool EnableNegativeMarking { get; set; }
        [JsonIgnore]
        public virtual List<ExamQuestion>? ExamQuestions { get; set; }
    }

    public class ExamInsertDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public DateTime ExamDateStart { get; set; }
        public DateTime ExamDateEnd { get; set; }
        public int CourseId { get; set; }
        public decimal PassPoint { get; set; }
        public int DurationMinutes { get; set; }
        public bool HasLiveVideo { get; set; }
        public string? VideoIframeUrl { get; set; }
        public string? VideoInstructions { get; set; }
        public bool EnableNegativeMarking { get; set; }
    }

    public class ExamQuestionDto
    {
        public int Id { get; set; }
        public string Question { get; set; } = string.Empty;
        public ChoiceEnum TrueChoice { get; set; }
        public int ExamId { get; set; }
        [JsonIgnore]
        public ExamDto? Exam { get; set; }
        public string? ChoiceA { get; set; }
        public string? ChoiceB { get; set; }
        public string? ChoiceC { get; set; }
        public string? ChoiceD { get; set; }
        public string? ChoiceE { get; set; }
        public SectionEnum Section { get; set; }
        public DifficultyEnum Difficulty { get; set; }
        public string? Explanation { get; set; }
        public double PositiveMarks { get; set; }
        public double NegativeMarks { get; set; }
    }

    public class ExamQuestionInsertDto
    {
        public int Id { get; set; }
        public string Question { get; set; } = string.Empty;
        public ChoiceEnum TrueChoice { get; set; } = ChoiceEnum.A;
        public int ExamId { get; set; }
        public string? ChoiceA { get; set; } = string.Empty;
        public string? ChoiceB { get; set; } = string.Empty;
        public string? ChoiceC { get; set; } = string.Empty;
        public string? ChoiceD { get; set; } = string.Empty;
        public string? ChoiceE { get; set; } = string.Empty;
        public SectionEnum Section { get; set; } = SectionEnum.Quantitative;
        public DifficultyEnum Difficulty { get; set; } = DifficultyEnum.Medium;
        public string? Explanation { get; set; }
        public double PositiveMarks { get; set; } = 4.0;
        public double NegativeMarks { get; set; } = 1.0;
    }

    public class AutoSaveAnswerDto
    {
        public int ExamId { get; set; }
        public int QuestionId { get; set; }
        public int? Choice { get; set; }
        public bool IsMarkedForReview { get; set; }
        public int TimeSpentSeconds { get; set; }
    }

    public class AutoSaveStateDto
    {
        public int ExamId { get; set; }
        public bool IsSubmitted { get; set; }
        public Dictionary<int, int> Answers { get; set; } = new();
        public Dictionary<int, bool> MarkedForReview { get; set; } = new();
        public Dictionary<int, int> TimeSpent { get; set; } = new();
    }

    public class ExamSolutionReviewDto
    {
        public int ExamId { get; set; }
        public string ExamName { get; set; }
        public int CourseId { get; set; }
        public string CourseName { get; set; }
        public double Score { get; set; }
        public double NetScore { get; set; }
        public double PositiveScore { get; set; }
        public double NegativePenalty { get; set; }
        public bool IsPassed { get; set; }
        public int CorrectAnswers { get; set; }
        public int WrongAnswers { get; set; }
        public int SkippedAnswers { get; set; }
        public int TotalQuestions { get; set; }
        public int TotalTimeSpentSeconds { get; set; }
        public List<QuestionReviewItemDto> Questions { get; set; } = new();
        public List<SectionAnalyticsDto> SectionAnalytics { get; set; } = new();
        public SpeedAccuracyDto SpeedAccuracy { get; set; } = new();
    }

    public class QuestionReviewItemDto
    {
        public int QuestionId { get; set; }
        public string Question { get; set; }
        public SectionEnum Section { get; set; }
        public DifficultyEnum Difficulty { get; set; }
        public string ChoiceA { get; set; }
        public string ChoiceB { get; set; }
        public string ChoiceC { get; set; }
        public string ChoiceD { get; set; }
        public string ChoiceE { get; set; }
        public int? UserChoice { get; set; }
        public int CorrectChoice { get; set; }
        public bool IsCorrect { get; set; }
        public bool IsSkipped { get; set; }
        public bool IsMarkedForReview { get; set; }
        public string? Explanation { get; set; }
        public double MarksAwarded { get; set; }
        public int TimeSpentSeconds { get; set; }
    }

    public class SectionAnalyticsDto
    {
        public string SectionName { get; set; }
        public int SectionId { get; set; }
        public int TotalQuestions { get; set; }
        public int CorrectCount { get; set; }
        public int WrongCount { get; set; }
        public int SkippedCount { get; set; }
        public double AccuracyPercent { get; set; }
        public double Score { get; set; }
    }

    public class SpeedAccuracyDto
    {
        public double AvgTimePerCorrectSeconds { get; set; }
        public double AvgTimePerWrongSeconds { get; set; }
        public double OverallAccuracyPercent { get; set; }
        public int TotalTimeSpentSeconds { get; set; }
        public string RecommendedPacing { get; set; }
    }
}
