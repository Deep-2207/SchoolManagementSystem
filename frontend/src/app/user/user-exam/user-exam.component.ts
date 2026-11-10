import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ExamService } from '../../course/exam/exam.service';
import { SignalRService } from 'src/signalR.service';
import { Subscription, interval } from 'rxjs';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-user-exam',
  templateUrl: './user-exam.component.html',
  styleUrls: ['./user-exam.component.scss'],
  providers: [MessageService]
})
export class UserExamComponent implements OnInit, OnDestroy {
  examId: number = 0;
  exam: any = {};
  questions: any[] = [];
  filteredQuestions: any[] = [];
  
  answers: { [questionId: number]: number } = {};
  markedForReview: { [questionId: number]: boolean } = {};
  visitedQuestions: { [questionId: number]: boolean } = {};
  timeSpentPerQuestion: { [questionId: number]: number } = {};

  selectedSection: number = 0; // 0 = All Sections, 1 = Quant, 2 = Logical, 3 = Verbal, 4 = Tech
  currentQuestionIndex: number = 0;

  remainingSeconds: number = 0;
  private timerSub?: Subscription;
  private tickerSub?: Subscription;

  examActive = true;
  examResult: any = null;
  showUnansweredDialog = false;
  unansweredQuestions: any[] = [];

  // Live Video iframe
  safeVideoUrl: SafeResourceUrl | null = null;
  isVideoMinimized: boolean = false;

  // Auto-Save telemetry
  isAutoSaving: boolean = false;
  lastAutoSavedTime: string = 'Just now';

  sections = [
    { id: 0, name: 'All Sections', icon: 'pi pi-th-large' },
    { id: 1, name: 'Quantitative', icon: 'pi pi-calculator' },
    { id: 2, name: 'Reasoning', icon: 'pi pi-compass' },
    { id: 3, name: 'Verbal Ability', icon: 'pi pi-book' },
    { id: 4, name: 'Technical', icon: 'pi pi-code' }
  ];

  constructor(
    private route: ActivatedRoute, 
    private examService: ExamService, 
    private signalRService: SignalRService, 
    private router: Router,
    private messageService: MessageService,
    private sanitizer: DomSanitizer
  ) {
    const paramExamId = this.route.snapshot.paramMap.get('id');
    if (paramExamId) {
      this.examId = Number(paramExamId);
    }
  }

  ngOnInit() {
    this.loadExamData();

    // Track active question time spent ticker
    this.tickerSub = interval(1000).subscribe(() => {
      if (this.examActive && this.filteredQuestions.length > 0) {
        const activeQ = this.filteredQuestions[this.currentQuestionIndex];
        if (activeQ) {
          this.timeSpentPerQuestion[activeQ.id] = (this.timeSpentPerQuestion[activeQ.id] || 0) + 1;
        }
      }
    });
  }

  ngOnDestroy() {
    this.examActive = false;
    this.timerSub?.unsubscribe();
    this.tickerSub?.unsubscribe();
    this.signalRService.stopConnection();
  }

  loadExamData() {
    this.examService.getExamById(this.examId).subscribe(exam => {
      this.exam = exam;
      if (exam.hasLiveVideo) {
        const videoUrl = exam.videoIframeUrl || 'https://www.youtube.com/embed/jfKfPfyJRdk';
        this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(videoUrl);
      }
    });

    this.examService.getQuestionsByExamId(this.examId).subscribe(questions => {
      this.questions = questions || [];
      this.filterBySection(this.selectedSection);

      // Restore previously saved state from backend
      this.restoreExamState();
    });

    // Sınavı başlat ve SignalR timer bağla
    this.examService.startExam(this.examId).subscribe(success => {
      if (success) {
        this.examActive = true;
        this.signalRService.startConnection().subscribe(() => {
          this.timerSub = this.signalRService.remainingSeconds$.subscribe(seconds => {
            this.remainingSeconds = seconds;
            
            if (seconds === 30 && this.examActive) {
              this.messageService.add({ 
                severity: 'warn', 
                summary: '⏰ 30 Seconds Remaining!', 
                detail: 'Review your marked answers and prepare for submission.', 
                life: 5000 
              });
            }
            
            if (seconds === 10 && this.examActive) {
              this.messageService.add({ 
                severity: 'error', 
                summary: '🚨 Final 10 Seconds!', 
                detail: 'Exam is automatically finishing now!', 
                life: 3000 
              });
            }
            
            if (seconds === 0 && this.examActive) {
              this.examActive = false;
              this.autoSubmitExam();
            }
          });
        });
      }
    });
  }

  restoreExamState() {
    this.examService.getExamState(this.examId).subscribe({
      next: (state) => {
        if (state) {
          if (state.isSubmitted) {
            this.router.navigate(['/user/grades']);
            return;
          }
          if (state.answers) {
            for (const [qIdStr, choiceVal] of Object.entries(state.answers)) {
              const qId = Number(qIdStr);
              this.answers[qId] = Number(choiceVal);
              this.visitedQuestions[qId] = true;
            }
          }
          if (state.markedForReview) {
            for (const [qIdStr, isMarked] of Object.entries(state.markedForReview)) {
              this.markedForReview[Number(qIdStr)] = !!isMarked;
            }
          }
          if (state.timeSpent) {
            for (const [qIdStr, secs] of Object.entries(state.timeSpent)) {
              this.timeSpentPerQuestion[Number(qIdStr)] = Number(secs);
            }
          }
          if (this.questions.length > 0) {
            this.visitedQuestions[this.questions[0].id] = true;
          }
        }
      },
      error: (err) => console.warn('Could not restore previous state:', err)
    });
  }

  filterBySection(sectionId: number) {
    this.selectedSection = sectionId;
    if (sectionId === 0) {
      this.filteredQuestions = [...this.questions];
    } else {
      this.filteredQuestions = this.questions.filter(q => q.section === sectionId);
    }
    this.currentQuestionIndex = 0;
    if (this.filteredQuestions.length > 0) {
      this.visitedQuestions[this.filteredQuestions[0].id] = true;
    }
  }

  getSectionQuestionCount(secId: number): number {
    if (secId === 0) return this.questions.length;
    return this.questions.filter(q => q.section === secId).length;
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  selectAnswer(questionId: number, choice: number) {
    if (!this.examActive) return;
    this.answers[questionId] = choice;
    this.visitedQuestions[questionId] = true;
    this.performAutoSave(questionId, choice, !!this.markedForReview[questionId]);
  }

  toggleMarkForReview(questionId: number) {
    if (!this.examActive) return;
    this.markedForReview[questionId] = !this.markedForReview[questionId];
    this.visitedQuestions[questionId] = true;
    this.performAutoSave(questionId, this.answers[questionId], !!this.markedForReview[questionId]);
  }

  clearResponse(questionId: number) {
    if (!this.examActive) return;
    delete this.answers[questionId];
    this.performAutoSave(questionId, undefined, !!this.markedForReview[questionId]);
  }

  saveAndNext(questionId: number) {
    this.visitedQuestions[questionId] = true;
    if (this.currentQuestionIndex < this.filteredQuestions.length - 1) {
      this.currentQuestionIndex++;
      const nextQ = this.filteredQuestions[this.currentQuestionIndex];
      if (nextQ) this.visitedQuestions[nextQ.id] = true;
    }
  }

  markForReviewAndNext(questionId: number) {
    this.toggleMarkForReview(questionId);
    this.saveAndNext(questionId);
  }

  goToQuestion(index: number) {
    if (index >= 0 && index < this.filteredQuestions.length) {
      this.currentQuestionIndex = index;
      const q = this.filteredQuestions[index];
      if (q) this.visitedQuestions[q.id] = true;
    }
  }

  goToPrevious() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      const q = this.filteredQuestions[this.currentQuestionIndex];
      if (q) this.visitedQuestions[q.id] = true;
    }
  }

  performAutoSave(questionId: number, choice?: number, isMarkedForReview: boolean = false) {
    this.isAutoSaving = true;
    const timeSpent = this.timeSpentPerQuestion[questionId] || 1;
    this.examService.autoSaveAnswer({
      examId: this.examId,
      questionId: questionId,
      choice: choice,
      isMarkedForReview: isMarkedForReview,
      timeSpentSeconds: timeSpent
    }).subscribe({
      next: () => {
        this.isAutoSaving = false;
        const now = new Date();
        this.lastAutoSavedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      },
      error: () => {
        this.isAutoSaving = false;
      }
    });
  }

  getQuestionState(questionId: number): 'unvisited' | 'unanswered' | 'answered' | 'review' | 'answered-review' {
    const hasAnswer = this.answers[questionId] !== undefined && this.answers[questionId] > 0;
    const isMarked = !!this.markedForReview[questionId];
    const isVisited = !!this.visitedQuestions[questionId];

    if (hasAnswer && isMarked) return 'answered-review';
    if (!hasAnswer && isMarked) return 'review';
    if (hasAnswer) return 'answered';
    if (isVisited) return 'unanswered';
    return 'unvisited';
  }

  getQuestionNumber(questionId: number): number {
    return this.questions.findIndex(q => q.id === questionId) + 1;
  }

  getQuestionPreview(question: string): string {
    return question.length > 80 ? question.slice(0, 80) + '...' : question;
  }

  getSectionName(sec: number): string {
    switch (sec) {
      case 1: return 'Quantitative';
      case 2: return 'Reasoning';
      case 3: return 'Verbal Ability';
      case 4: return 'Technical Core';
      default: return 'Quantitative';
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

  getDifficultyLabel(diff: number, question?: any): string {
    const pos = question?.positiveMarks || 4;
    const isNeg = this.exam?.enableNegativeMarking;
    const neg = isNeg ? (question?.negativeMarks || 1) : 0;
    const marksStr = isNeg ? `+${pos} / -${neg}` : `+${pos} / 0`;
    switch (diff) {
      case 1: return `Easy (${marksStr})`;
      case 2: return `Medium (${marksStr})`;
      case 3: return `Hard (${marksStr})`;
      default: return `Medium (${marksStr})`;
    }
  }

  // Submission Workflow
  submitAnswers() {
    if (!this.examActive) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Notice', 
        detail: 'Exam duration has completed.', 
        life: 3000 
      });
      return;
    }

    // Check unanswered questions
    this.unansweredQuestions = this.questions.filter(q => !this.answers[q.id]);
    if (this.unansweredQuestions.length > 0) {
      this.showUnansweredDialog = true;
      return;
    }

    this.performSubmit();
  }

  confirmSubmitWithUnanswered() {
    this.showUnansweredDialog = false;
    this.performSubmit();
  }

  cancelSubmitWithUnanswered() {
    this.showUnansweredDialog = false;
  }

  performSubmit() {
    this.examService.submitAnswers(this.examId, this.answers).subscribe({
      next: (result) => {
        this.examActive = false;
        this.examResult = result;
        
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Assessment Submitted', 
          detail: `Net Score: ${result.netScore || result.score} pts. Preparing Solution Review...`, 
          life: 4000 
        });

        setTimeout(() => {
          this.router.navigate(['/user/grades'], { queryParams: { examId: this.examId } });
        }, 2000);
      },
      error: (error) => {
        console.error('Submission error:', error);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Submission Error', 
          detail: 'Failed to record submission. Please check connection.', 
          life: 4000 
        });
      }
    });
  }

  private autoSubmitExam() {
    this.messageService.add({ 
      severity: 'error', 
      summary: '⏰ Time Expired!', 
      detail: 'Auto-submitting your completed answers...', 
      life: 4000 
    });

    this.examService.submitAnswers(this.examId, this.answers).subscribe({
      next: (result) => {
        this.examResult = result;
        setTimeout(() => {
          this.router.navigate(['/user/grades'], { queryParams: { examId: this.examId } });
        }, 2000);
      },
      error: () => {
        this.router.navigate(['/user/grades']);
      }
    });
  }
}
