using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Helpers;
using SchoolManagement.Models;
using SchoolManagement.Services.Interfaces;
using SchoolManagement.UnitOfWork;

namespace SchoolManagement.Services.Impls
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private IMapper Mapper
        {
            get;
        }

        public AuthService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            Mapper = mapper;
        }

        public Task<UserModel> Login(UserModel user)
        {
            var pass = StringCipher.Encrypt(user.password);
            var teacher = _unitOfWork.Teacher.TableNoTracking.FirstOrDefault(t => t.Email == user.email && t.Password == pass);
            var student = _unitOfWork.Student.TableNoTracking.FirstOrDefault(x => x.Password == pass && x.Email == user.email);

            if (teacher != null)
            {
                if (!teacher.IsActive)
                {
                    return Task.FromResult(new UserModel
                    {
                        message = "Your faculty account is deactivated. Please contact the administrator.",
                        success = false
                    });
                }

                bool isSuper = teacher.IsSuperAdmin;
                var result = new UserModel()
                {
                    id = teacher.Id,
                    name = teacher.Name,
                    email = teacher.Email,
                    password = teacher.Password,
                    isAdmin = true,
                    isSuperAdmin = isSuper,
                    isTeacher = !isSuper,
                    role = isSuper ? "admin" : "teacher",
                    message = "Login successful",
                    success = true
                };
                return Task.FromResult(result);
            }
            else if (student != null)
            {
                var result = new UserModel()
                {
                    id = student.Id,
                    name = student.Name,
                    number = student.Number,
                    email = student.Email,
                    password = student.Password,
                    isAdmin = false,
                    isSuperAdmin = false,
                    isTeacher = false,
                    role = "student",
                    message = "Login successful",
                    success = true
                };
                return Task.FromResult(result);
            }
            else
            {
                var result = new UserModel()
                {
                    message = "Invalid email or password",
                    success = false
                };
                return Task.FromResult(result);
            }
        }
    }
}
