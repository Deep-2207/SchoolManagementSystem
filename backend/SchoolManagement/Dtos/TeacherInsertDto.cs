namespace SchoolManagement.Dtos
{
    public class TeacherInsertDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public bool IsSuperAdmin { get; set; }
        public bool IsActive { get; set; } = true;
        public int? DepartmentId { get; set; }
    }
}
