namespace SchoolManagement.Dtos
{
    public class TeacherDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public bool IsSuperAdmin { get; set; }
        public bool IsActive { get; set; }
        public int? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public List<CourseDto> Courses { get; set; }
    }
}
