using System.ComponentModel.DataAnnotations.Schema;

namespace SchoolManagement.Context.Tables
{
    public enum SectionEnum
    {
        Quantitative = 1,
        LogicalReasoning = 2,
        VerbalAbility = 3,
        Technical = 4
    }

    public enum DifficultyEnum
    {
        Easy = 1,
        Medium = 2,
        Hard = 3
    }

    public class ExamQuestion
    {
        public int Id { get; set; }
        public string Question { get; set; }
        public ChoiceEnum TrueChoice { get; set; }
        public int ExamId { get; set; }
        [ForeignKey("ExamId")]
        public virtual Exam Exam { get; set; }
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

    public enum ChoiceEnum
    {
        A = 1,
        B = 2,
        C = 3,
        D = 4,
        E = 5,
    }
}
