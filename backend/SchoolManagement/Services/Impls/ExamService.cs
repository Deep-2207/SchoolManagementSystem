using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Context.Tables;
using SchoolManagement.Dtos;
using SchoolManagement.Migrations;
using SchoolManagement.Services.Interfaces;
using SchoolManagement.UnitOfWork;

namespace SchoolManagement.Services.Impls
{
    public class ExamService : IExamService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ISignalRService _signalRService;
        private readonly IUserService _userService;

        private IMapper Mapper
        {
            get;
        }

        public ExamService(IUnitOfWork unitOfWork, ISignalRService signalRService, IMapper mapper, IUserService userService)
        {
            _unitOfWork = unitOfWork;
            _signalRService = signalRService;
            Mapper = mapper;
            _userService = userService;
        }

        public async Task<int> Insert(ExamInsertDto examDto)
        {
            try
            {
                var exam = Mapper.Map<Exam>(examDto);
                var start = exam.ExamDateStart == default || exam.ExamDateStart.Year < 2000 ? DateTime.UtcNow : exam.ExamDateStart;
                var end = exam.ExamDateEnd == default || exam.ExamDateEnd.Year < 2000 || exam.ExamDateEnd <= start ? start.AddDays(7) : exam.ExamDateEnd;
                exam.ExamDateStart = DateTime.SpecifyKind(start, DateTimeKind.Utc);
                exam.ExamDateEnd = DateTime.SpecifyKind(end, DateTimeKind.Utc);
                await _unitOfWork.Exam.Insert(exam);
                return exam.Id;
            }
            catch (Exception)
            {
                return -1;
            }
        }

        public async Task<List<ExamDto>> GetAll()
        {
            var exams = _unitOfWork.Exam.Table.Include(c => c.Course);
            var Dtos = Mapper.Map<List<ExamDto>>(exams);
            return Dtos;
        }

        public async Task<bool> Update(ExamInsertDto examDto)
        {
            try
            {
                var entity = await _unitOfWork.Exam.FindById(examDto.Id);
                var exam = Mapper.Map(examDto, entity);
                if (exam.ExamDateStart != default) exam.ExamDateStart = DateTime.SpecifyKind(exam.ExamDateStart, DateTimeKind.Utc);
                if (exam.ExamDateEnd != default) exam.ExamDateEnd = DateTime.SpecifyKind(exam.ExamDateEnd, DateTimeKind.Utc);
                int result = await _unitOfWork.Exam.Update(exam);
                return result > 0;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<bool> Delete(int examId)
        {
            try
            {
                var exam = await _unitOfWork.Exam.FindById(examId);
                int result = await _unitOfWork.Exam.Delete(exam);
                return result > 0;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<bool> Delete(List<int> examIds)
        {
            try
            {
                var exams = new List<Exam>();
                foreach (var id in examIds)
                {
                    var exam = await _unitOfWork.Exam.FindById(id);
                    if (exam != null)
                        exams.Add(exam);
                }

                int result = await _unitOfWork.Exam.Delete(exams);
                return result > 0;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<int> InsertQuestion(ExamQuestionInsertDto examQuestionDto)
        {
            try
            {
                var examQuestion = Mapper.Map<ExamQuestion>(examQuestionDto);
                await _unitOfWork.ExamQuestion.Insert(examQuestion);
                return examQuestion.Id;
            }
            catch (Exception)
            {
                return -1;
            }
        }

        public async Task<int> BulkInsertQuestions(List<ExamQuestionInsertDto> dtos)
        {
            try
            {
                if (dtos == null || !dtos.Any())
                    return 0;

                int count = 0;
                foreach (var dto in dtos)
                {
                    var entity = Mapper.Map<ExamQuestion>(dto);
                    if (entity.PositiveMarks <= 0) entity.PositiveMarks = 4.0;
                    if (entity.NegativeMarks <= 0) entity.NegativeMarks = 1.0;
                    await _unitOfWork.ExamQuestion.Insert(entity);
                    count++;
                }
                return count;
            }
            catch (Exception)
            {
                return -1;
            }
        }

        public async Task<List<ExamQuestionDto>> GetQuestionsByExamId(int examId)
        {
            var examQuestions = _unitOfWork.ExamQuestion.Table
                .Include(e => e.Exam)
                .Where(e => e.ExamId == examId);
            var dtos = Mapper.Map<List<ExamQuestionDto>>(examQuestions);
            return dtos;
        }

        public async Task<bool> UpdateQuestion(ExamQuestionInsertDto examQuestionDto)
        {
            try
            {
                var entity = await _unitOfWork.ExamQuestion.FindById(examQuestionDto.Id);
                var examQuestion = Mapper.Map(examQuestionDto, entity);
                int result = await _unitOfWork.ExamQuestion.Update(examQuestion);
                return result > 0;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<bool> DeleteQuestion(int QuestionId)
        {
            try
            {
                var question = await _unitOfWork.ExamQuestion.FindById(QuestionId);
                int result = await _unitOfWork.ExamQuestion.Delete(question);
                return result > 0;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<bool> DeleteQuestions(List<int> QuestionIds)
        {
            try
            {
                var questions = new List<ExamQuestion>();
                foreach (var id in QuestionIds)
                {
                    var question = await _unitOfWork.ExamQuestion.FindById(id);
                    if (question != null)
                        questions.Add(question);
                }

                int result = await _unitOfWork.ExamQuestion.Delete(questions);
                return result > 0;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<ExamDto> GetExamById(int examId)
        {
            var exam = await _unitOfWork.Exam.FindById(examId);
            var examDto = Mapper.Map<ExamDto>(exam);
            return examDto;
        }

        public async Task<List<ExamDto>> GetExamsByCourseId(int courseId)
        {
            var exams = _unitOfWork.Exam.Table
                .Include(c => c.Course)
                .Where(e => e.CourseId == courseId);
            var dtos = Mapper.Map<List<ExamDto>>(exams);
            return dtos;
        }

        public async Task<bool> StartExam(int examId)
        {
            var exam = await _unitOfWork.Exam.FindById(examId);
            if (exam == null)
                return false;

            await _signalRService.StartExam(exam.DurationMinutes);
            return true;
        }

        public async Task<List<CourseDto>> GetUserCourses()
        {
            var user = await _userService.getUser();
            var courses = await _unitOfWork.Course.Table
                .Include(c => c.Department)
                .Include(c => c.Teacher)
                .Include(c => c.Students)
                .Where(c => c.Students.Any(s => s.Id == user.id))
                .ToListAsync();

            return Mapper.Map<List<CourseDto>>(courses);
        }

        public async Task<List<UserExamResultDto>> GetUserExamResults(int courseId)
        {
            var user = await _userService.getUser();

            var exams = await _unitOfWork.Exam.Table
                .Where(e => e.CourseId == courseId)
                .ToListAsync();

            var results = new List<UserExamResultDto>();

            foreach (var exam in exams)
            {
                var studentExam = await _unitOfWork.StudentExam.Table
                    .FirstOrDefaultAsync(se => se.ExamId == exam.Id && se.StudentId == user.id && se.IsSubmitted);

                if (studentExam != null)
                {
                    var studentAnswers = await _unitOfWork.StudentAnswer.Table
                        .Where(sa => sa.StudentExamId == studentExam.Id)
                        .ToListAsync();

                    int correctAnswers = 0;
                    foreach (var sa in studentAnswers)
                    {
                        var question = await _unitOfWork.ExamQuestion.FindById(sa.ExamQuestionId);
                        if (question != null && question.TrueChoice == sa.Choice)
                            correctAnswers++;
                    }

                    int totalQuestions = await _unitOfWork.ExamQuestion.Table
                        .Where(q => q.ExamId == exam.Id)
                        .CountAsync();

                    results.Add(new UserExamResultDto
                    {
                        ExamId = exam.Id,
                        ExamName = exam.Name,
                        Score = studentExam.Grade,
                        NetScore = studentExam.NetScore,
                        PositiveScore = studentExam.TotalPositiveScore,
                        NegativePenalty = studentExam.TotalNegativePenalty,
                        IsPassed = (decimal)studentExam.Grade >= exam.PassPoint,
                        SubmittedAt = studentExam.ExamEndDate,
                        CorrectAnswers = correctAnswers,
                        TotalQuestions = totalQuestions > 0 ? totalQuestions : studentAnswers.Count
                    });
                }
            }

            return results;
        }

        public async Task<bool> CheckExamSubmission(int examId)
        {
            var user = await _userService.getUser();
            var submission = await _unitOfWork.StudentExam.Table
                .FirstOrDefaultAsync(se => se.ExamId == examId && se.StudentId == user.id && se.IsSubmitted);
            return submission != null;
        }

        public async Task<bool> AutoSaveAnswer(AutoSaveAnswerDto dto)
        {
            try
            {
                var user = await _userService.getUser();
                int studentId = user.id;

                var studentExam = await _unitOfWork.StudentExam.Table
                    .Include(se => se.StudentAnswers)
                    .FirstOrDefaultAsync(se => se.ExamId == dto.ExamId && se.StudentId == studentId);

                if (studentExam == null)
                {
                    studentExam = new StudentExam
                    {
                        ExamId = dto.ExamId,
                        StudentId = studentId,
                        ExamStartDate = DateTime.UtcNow,
                        ExamEndDate = DateTime.UtcNow,
                        IsSubmitted = false
                    };
                    await _unitOfWork.StudentExam.Insert(studentExam);
                }

                if (studentExam.IsSubmitted)
                {
                    return false; // Already submitted
                }

                var studentAnswer = studentExam.StudentAnswers
                    .FirstOrDefault(sa => sa.ExamQuestionId == dto.QuestionId);

                if (studentAnswer == null)
                {
                    studentAnswer = new StudentAnswer
                    {
                        StudentExamId = studentExam.Id,
                        ExamQuestionId = dto.QuestionId,
                        Choice = dto.Choice.HasValue && dto.Choice.Value > 0 ? (ChoiceEnum)dto.Choice.Value : null,
                        IsMarkedForReview = dto.IsMarkedForReview,
                        TimeSpentSeconds = dto.TimeSpentSeconds,
                        LastUpdated = DateTime.UtcNow
                    };
                    await _unitOfWork.StudentAnswer.Insert(studentAnswer);
                }
                else
                {
                    if (dto.Choice.HasValue)
                    {
                        studentAnswer.Choice = dto.Choice.Value > 0 ? (ChoiceEnum)dto.Choice.Value : null;
                    }
                    studentAnswer.IsMarkedForReview = dto.IsMarkedForReview;
                    if (dto.TimeSpentSeconds > 0)
                    {
                        studentAnswer.TimeSpentSeconds += dto.TimeSpentSeconds;
                    }
                    studentAnswer.LastUpdated = DateTime.UtcNow;
                    await _unitOfWork.StudentAnswer.Update(studentAnswer);
                }

                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<AutoSaveStateDto> GetExamState(int examId)
        {
            var user = await _userService.getUser();
            var studentExam = await _unitOfWork.StudentExam.Table
                .Include(se => se.StudentAnswers)
                .FirstOrDefaultAsync(se => se.ExamId == examId && se.StudentId == user.id);

            var state = new AutoSaveStateDto { ExamId = examId };
            if (studentExam != null)
            {
                state.IsSubmitted = studentExam.IsSubmitted;
                foreach (var sa in studentExam.StudentAnswers)
                {
                    if (sa.Choice.HasValue)
                    {
                        state.Answers[sa.ExamQuestionId] = (int)sa.Choice.Value;
                    }
                    state.MarkedForReview[sa.ExamQuestionId] = sa.IsMarkedForReview;
                    state.TimeSpent[sa.ExamQuestionId] = sa.TimeSpentSeconds;
                }
            }
            return state;
        }

        public async Task<ExamSubmitResultDto> SubmitAnswers(ExamSubmitAnswersDto dto)
        {
            var user = await _userService.getUser();
            int studentId = user.id;

            var questions = await _unitOfWork.ExamQuestion.Table
                .Where(q => q.ExamId == dto.ExamId)
                .ToListAsync();

            var exam = await _unitOfWork.Exam.FindById(dto.ExamId);

            var studentExam = await _unitOfWork.StudentExam.Table
                .Include(se => se.StudentAnswers)
                .FirstOrDefaultAsync(se => se.ExamId == dto.ExamId && se.StudentId == studentId);

            if (studentExam == null)
            {
                studentExam = new StudentExam
                {
                    ExamId = dto.ExamId,
                    StudentId = studentId,
                    ExamStartDate = DateTime.UtcNow,
                    ExamEndDate = DateTime.UtcNow
                };
                await _unitOfWork.StudentExam.Insert(studentExam);
            }

            var results = new List<ExamSubmitQuestionResultDto>();
            int correctCount = 0;
            int wrongCount = 0;
            int skippedCount = 0;
            double positiveScore = 0;
            double negativePenalty = 0;

            foreach (var question in questions)
            {
                int userAnswer = 0;
                bool hasAnswer = dto.Answers != null && dto.Answers.TryGetValue(question.Id, out userAnswer) && userAnswer > 0;
                var existingAnswer = studentExam.StudentAnswers?.FirstOrDefault(sa => sa.ExamQuestionId == question.Id);

                if (hasAnswer)
                {
                    bool isCorrect = ((int)question.TrueChoice == userAnswer);
                    if (isCorrect)
                    {
                        correctCount++;
                        positiveScore += (question.PositiveMarks > 0 ? question.PositiveMarks : 4.0);
                    }
                    else
                    {
                        wrongCount++;
                        if (exam != null && exam.EnableNegativeMarking)
                        {
                            negativePenalty += (question.NegativeMarks > 0 ? question.NegativeMarks : 1.0);
                        }
                    }

                    results.Add(new ExamSubmitQuestionResultDto
                    {
                        QuestionId = question.Id,
                        UserAnswer = userAnswer,
                        CorrectAnswer = (int)question.TrueChoice,
                        IsCorrect = isCorrect
                    });

                    if (existingAnswer == null)
                    {
                        var sa = new StudentAnswer
                        {
                            StudentExamId = studentExam.Id,
                            ExamQuestionId = question.Id,
                            Choice = (ChoiceEnum)userAnswer,
                            LastUpdated = DateTime.UtcNow
                        };
                        await _unitOfWork.StudentAnswer.Insert(sa);
                    }
                    else
                    {
                        existingAnswer.Choice = (ChoiceEnum)userAnswer;
                        existingAnswer.LastUpdated = DateTime.UtcNow;
                        await _unitOfWork.StudentAnswer.Update(existingAnswer);
                    }
                }
                else
                {
                    skippedCount++;
                    results.Add(new ExamSubmitQuestionResultDto
                    {
                        QuestionId = question.Id,
                        UserAnswer = 0,
                        CorrectAnswer = (int)question.TrueChoice,
                        IsCorrect = false
                    });
                }
            }

            int totalQuestions = questions.Count;
            double score = totalQuestions > 0 ? Math.Round((double)correctCount / totalQuestions * 100, 2) : 0;
            double netScore = Math.Max(0, positiveScore - negativePenalty);
            bool isPassed = exam != null && score >= (double)exam.PassPoint;

            studentExam.Grade = score;
            studentExam.TotalPositiveScore = positiveScore;
            studentExam.TotalNegativePenalty = negativePenalty;
            studentExam.NetScore = netScore;
            studentExam.ExamEndDate = DateTime.UtcNow;
            studentExam.IsSubmitted = true;
            await _unitOfWork.StudentExam.Update(studentExam);

            return new ExamSubmitResultDto
            {
                Score = score,
                NetScore = netScore,
                PositiveScore = positiveScore,
                NegativePenalty = negativePenalty,
                IsPassed = isPassed,
                CorrectAnswers = correctCount,
                WrongAnswers = wrongCount,
                SkippedAnswers = skippedCount,
                TotalQuestions = totalQuestions,
                Results = results
            };
        }

        public async Task<ExamSolutionReviewDto> GetSolutionReview(int examId)
        {
            var user = await _userService.getUser();
            var exam = await _unitOfWork.Exam.Table
                .Include(e => e.Course)
                .FirstOrDefaultAsync(e => e.Id == examId);

            var questions = await _unitOfWork.ExamQuestion.Table
                .Where(q => q.ExamId == examId)
                .ToListAsync();

            var studentExam = await _unitOfWork.StudentExam.Table
                .Include(se => se.StudentAnswers)
                .FirstOrDefaultAsync(se => se.ExamId == examId && se.StudentId == user.id);

            var review = new ExamSolutionReviewDto
            {
                ExamId = examId,
                ExamName = exam?.Name ?? "Assessment",
                CourseId = exam?.CourseId ?? 0,
                CourseName = exam?.Course?.Name ?? "Course",
                Score = studentExam?.Grade ?? 0,
                NetScore = studentExam?.NetScore ?? 0,
                PositiveScore = studentExam?.TotalPositiveScore ?? 0,
                NegativePenalty = studentExam?.TotalNegativePenalty ?? 0,
                IsPassed = exam != null && (studentExam?.Grade ?? 0) >= (double)exam.PassPoint,
                TotalQuestions = questions.Count
            };

            int correctCount = 0;
            int wrongCount = 0;
            int skippedCount = 0;
            int totalTimeSpent = 0;
            int correctTimeSpent = 0;
            int wrongTimeSpent = 0;

            var sectionGroups = questions.GroupBy(q => q.Section);

            foreach (var q in questions)
            {
                var ans = studentExam?.StudentAnswers?.FirstOrDefault(sa => sa.ExamQuestionId == q.Id);
                int? userChoice = (ans != null && ans.Choice.HasValue) ? (int)ans.Choice.Value : null;
                bool isSkipped = !userChoice.HasValue || userChoice.Value == 0;
                bool isCorrect = !isSkipped && userChoice.Value == (int)q.TrueChoice;
                int timeSpent = ans?.TimeSpentSeconds ?? 0;
                totalTimeSpent += timeSpent;

                double marksAwarded = 0;
                if (isCorrect)
                {
                    correctCount++;
                    correctTimeSpent += timeSpent;
                    marksAwarded = q.PositiveMarks > 0 ? q.PositiveMarks : 4.0;
                }
                else if (!isSkipped)
                {
                    wrongCount++;
                    wrongTimeSpent += timeSpent;
                    marksAwarded = (exam != null && exam.EnableNegativeMarking) ? -(q.NegativeMarks > 0 ? q.NegativeMarks : 1.0) : 0.0;
                }
                else
                {
                    skippedCount++;
                }

                review.Questions.Add(new QuestionReviewItemDto
                {
                    QuestionId = q.Id,
                    Question = q.Question,
                    Section = q.Section,
                    Difficulty = q.Difficulty,
                    ChoiceA = q.ChoiceA,
                    ChoiceB = q.ChoiceB,
                    ChoiceC = q.ChoiceC,
                    ChoiceD = q.ChoiceD,
                    ChoiceE = q.ChoiceE,
                    UserChoice = userChoice,
                    CorrectChoice = (int)q.TrueChoice,
                    IsCorrect = isCorrect,
                    IsSkipped = isSkipped,
                    IsMarkedForReview = ans?.IsMarkedForReview ?? false,
                    Explanation = !string.IsNullOrEmpty(q.Explanation) ? q.Explanation : "Step-by-step mathematical and conceptual explanation provided by the faculty.",
                    MarksAwarded = marksAwarded,
                    TimeSpentSeconds = timeSpent
                });
            }

            review.CorrectAnswers = correctCount;
            review.WrongAnswers = wrongCount;
            review.SkippedAnswers = skippedCount;
            review.TotalTimeSpentSeconds = totalTimeSpent;

            foreach (var group in sectionGroups)
            {
                int secTotal = group.Count();
                int secCorrect = 0;
                int secWrong = 0;
                int secSkipped = 0;
                double secScore = 0;

                foreach (var item in group)
                {
                    var qReview = review.Questions.FirstOrDefault(x => x.QuestionId == item.Id);
                    if (qReview != null)
                    {
                        if (qReview.IsCorrect)
                        {
                            secCorrect++;
                            secScore += item.PositiveMarks > 0 ? item.PositiveMarks : 4.0;
                        }
                        else if (!qReview.IsSkipped)
                        {
                            secWrong++;
                            if (exam != null && exam.EnableNegativeMarking)
                            {
                                secScore -= item.NegativeMarks > 0 ? item.NegativeMarks : 1.0;
                            }
                        }
                        else
                        {
                            secSkipped++;
                        }
                    }
                }

                review.SectionAnalytics.Add(new SectionAnalyticsDto
                {
                    SectionId = (int)group.Key,
                    SectionName = group.Key.ToString(),
                    TotalQuestions = secTotal,
                    CorrectCount = secCorrect,
                    WrongCount = secWrong,
                    SkippedCount = secSkipped,
                    AccuracyPercent = secTotal > 0 ? Math.Round((double)secCorrect / secTotal * 100, 1) : 0,
                    Score = Math.Max(0, secScore)
                });
            }

            review.SpeedAccuracy = new SpeedAccuracyDto
            {
                AvgTimePerCorrectSeconds = correctCount > 0 ? Math.Round((double)correctTimeSpent / correctCount, 1) : 0,
                AvgTimePerWrongSeconds = wrongCount > 0 ? Math.Round((double)wrongTimeSpent / wrongCount, 1) : 0,
                OverallAccuracyPercent = (correctCount + wrongCount) > 0 ? Math.Round((double)correctCount / (correctCount + wrongCount) * 100, 1) : 0,
                TotalTimeSpentSeconds = totalTimeSpent,
                RecommendedPacing = (correctCount > 0 && (double)correctTimeSpent / correctCount < 90) ? "Optimal (Fast & Accurate)" : "Review speed pacing on hard questions"
            };

            return review;
        }

        public async Task<List<ExamDto>> GetLiveClasses()
        {
            try
            {
                var exams = await _unitOfWork.Exam.Table
                    .Include(e => e.Course)
                        .ThenInclude(c => c.Teacher)
                    .Include(e => e.Course)
                        .ThenInclude(c => c.Department)
                    .Where(e => e.HasLiveVideo)
                    .OrderByDescending(e => e.Id)
                    .ToListAsync();

                var dtos = Mapper.Map<List<ExamDto>>(exams);
                return dtos;
            }
            catch (Exception)
            {
                return new List<ExamDto>();
            }
        }
    }
}
