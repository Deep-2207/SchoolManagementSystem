using System.ComponentModel.DataAnnotations.Schema;

namespace SchoolManagement.Context.Tables
{
    public class StudentExam
    {
        public StudentExam()
        {
            StudentAnswers = new HashSet<StudentAnswer>();
        }
        public int Id { get; set; }
        public int ExamId { get; set; }
        public int StudentId { get; set; }
        public DateTime ExamStartDate { get; set; }
        public DateTime ExamEndDate { get; set; }
        public double Grade { get; set; }
        public double TotalPositiveScore { get; set; } = 0;
        public double TotalNegativePenalty { get; set; } = 0;
        public double NetScore { get; set; } = 0;
        public int TotalTimeSpentSeconds { get; set; } = 0;
        public bool IsSubmitted { get; set; } = false;

        [ForeignKey("ExamId")]
        public virtual Exam Exam { get; set; }
        [ForeignKey("StudentId")]
        public virtual Student Student { get; set; }
        public virtual ICollection<StudentAnswer> StudentAnswers { get; set; }
    }
}
