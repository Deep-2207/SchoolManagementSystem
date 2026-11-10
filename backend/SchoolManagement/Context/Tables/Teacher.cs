using System.ComponentModel.DataAnnotations.Schema;

namespace SchoolManagement.Context.Tables
{
    public class Teacher
    {
        public Teacher()
        {
            Courses = new HashSet<Course>();
        }

        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }

        public bool IsSuperAdmin { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public int? DepartmentId { get; set; }
        [ForeignKey("DepartmentId")]
        public virtual Department? Department { get; set; }

        public virtual ICollection<Course> Courses { get; set; }
    }
}
