import { Component, OnInit } from '@angular/core';
import { ExamService } from '../../course/exam/exam.service';
import { MessageService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-user-grades',
  templateUrl: './user-grades.component.html',
  styleUrls: ['./user-grades.component.scss'],
  providers: [MessageService]
})
export class UserGradesComponent implements OnInit {
  courses: any[] = [];
  selectedCourse: any = null;
  exams: any[] = [];
  examResults: any[] = [];
  courseAverage: number = 0;
  loading: boolean = false;

  // Comprehensive Solution Review & Analytics
  activeReview: any = null;
  reviewFilter: string = 'all'; // 'all' | 'correct' | 'wrong' | 'skipped'

  constructor(
    private examService: ExamService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCourses();

    this.route.queryParams.subscribe(params => {
      if (params['examId']) {
        const examId = Number(params['examId']);
        this.openSolutionReview(examId);
      } else if (params['courseId']) {
        setTimeout(() => {
          this.selectedCourse = this.courses.find(c => c.id == params['courseId']);
          if (this.selectedCourse) {
            this.loadExamResults();
          }
        }, 800);
      }
    });
  }

  loadCourses() {
    this.loading = true;
    this.examService.getUserCourses().subscribe({
      next: (courses) => {
        this.courses = courses || [];
        if (this.courses.length > 0 && !this.selectedCourse) {
          this.selectedCourse = this.courses[0];
          this.loadExamResults();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.loading = false;
      }
    });
  }

  onCourseSelect() {
    if (this.selectedCourse) {
      this.loadExamResults();
    }
  }

  loadExamResults() {
    if (!this.selectedCourse) return;
    this.loading = true;
    this.examService.getUserExamResults(this.selectedCourse.id).subscribe({
      next: (results) => {
        this.examResults = results || [];
        this.calculateAverage();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading exam results:', error);
        this.loading = false;
      }
    });
  }

  calculateAverage() {
    if (this.examResults.length > 0) {
      const totalScore = this.examResults.reduce((sum, result) => sum + (result.score || 0), 0);
      this.courseAverage = totalScore / this.examResults.length;
    } else {
      this.courseAverage = 0;
    }
  }

  getPassedCount(): number {
    return this.examResults.filter(r => r.isPassed).length;
  }

  getFailedCount(): number {
    return this.examResults.filter(r => !r.isPassed).length;
  }

  getGradeColor(score: number): string {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  openSolutionReview(examId: number) {
    this.loading = true;
    this.examService.getSolutionReview(examId).subscribe({
      next: (review) => {
        this.activeReview = review;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading solution review:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Notice',
          detail: 'Could not load solution review. Please attempt test first.',
          life: 4000
        });
        this.loading = false;
      }
    });
  }

  closeSolutionReview() {
    this.activeReview = null;
    this.router.navigate(['/user/grades']);
  }

  getFilteredQuestions(): any[] {
    if (!this.activeReview || !this.activeReview.questions) return [];
    if (this.reviewFilter === 'correct') {
      return this.activeReview.questions.filter(q => q.isCorrect);
    }
    if (this.reviewFilter === 'wrong') {
      return this.activeReview.questions.filter(q => !q.isCorrect && !q.isSkipped);
    }
    if (this.reviewFilter === 'skipped') {
      return this.activeReview.questions.filter(q => q.isSkipped);
    }
    return this.activeReview.questions;
  }

  getChoiceLetter(choice: number): string {
    const letters = ['', 'A', 'B', 'C', 'D', 'E'];
    return letters[choice] || '-';
  }

  getSectionName(sec: number): string {
    switch (sec) {
      case 1: return 'Quantitative';
      case 2: return 'Logical Reasoning';
      case 3: return 'Verbal Ability';
      case 4: return 'Technical Core';
      default: return 'General';
    }
  }

  getSectionBadgeClass(sec: number): string {
    switch (sec) {
      case 1: return 'section-pill-quant';
      case 2: return 'section-pill-logical';
      case 3: return 'section-pill-verbal';
      case 4: return 'section-pill-tech';
      default: return 'section-pill-quant';
    }
  }

  getDifficultyClass(diff: number): string {
    switch (diff) {
      case 1: return 'diff-badge-easy';
      case 2: return 'diff-badge-medium';
      case 3: return 'diff-badge-hard';
      default: return 'diff-badge-medium';
    }
  }

  getDifficultyLabel(diff: number): string {
    switch (diff) {
      case 1: return 'Easy';
      case 2: return 'Medium';
      case 3: return 'Hard';
      default: return 'Medium';
    }
  }

  goToExams() {
    this.router.navigate(['/user/index']);
  }
}
