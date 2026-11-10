using System.ComponentModel.DataAnnotations.Schema;

namespace SchoolManagement.Context.Tables
{
    public class StudentAnswer
    {
        public int Id { get; set; }
        public int StudentExamId { get; set; }
        public ChoiceEnum? Choice { get; set; }
        public int ExamQuestionId { get; set; }
        public bool IsMarkedForReview { get; set; } = false;
        public int TimeSpentSeconds { get; set; } = 0;
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

        [ForeignKey("StudentExamId")]
        public virtual StudentExam StudentExam { get; set; }
        [ForeignKey("ExamQuestionId")]
        public virtual ExamQuestion ExamQuestion { get; set; }
    }
}
