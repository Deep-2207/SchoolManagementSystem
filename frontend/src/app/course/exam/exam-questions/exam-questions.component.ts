import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ExamService } from '../exam.service';

@Component({
  selector: 'app-exam-questions',
  templateUrl: './exam-questions.component.html',
  styleUrls: ['./exam-questions.component.scss'],
  providers: [MessageService]
})
export class ExamQuestionsComponent implements OnInit {

  questionDialog: boolean = false;
  deleteQuestionDialog: boolean = false;
  deleteQuestionsDialog: boolean = false;

  // Bulk Upload State
  bulkUploadDialog: boolean = false;
  bulkUploadMode: 'file' | 'paste' = 'file';
  pastedContent: string = '';
  parsedQuestions: any[] = [];
  parseErrorMessage: string = '';
  isImporting: boolean = false;

  questions: any[] = [];
  question: any = {};
  selectedQuestions: any[] = [];
  submitted: boolean = false;
  rowsPerPageOptions = [5, 10, 20];
  examId: number = 0;

  sections = [
    { label: '📐 Quantitative Aptitude', value: 1 },
    { label: '🧩 Logical Reasoning', value: 2 },
    { label: '📚 Verbal Ability', value: 3 },
    { label: '💻 Technical Core', value: 4 }
  ];

  difficulties = [
    { label: 'Easy (+4 / -1)', value: 1 },
    { label: 'Medium (+4 / -1)', value: 2 },
    { label: 'Hard (+4 / -1)', value: 3 }
  ];

  choices = [
    { label: 'Choice A', value: 1 },
    { label: 'Choice B', value: 2 },
    { label: 'Choice C', value: 3 },
    { label: 'Choice D', value: 4 },
    { label: 'Choice E', value: 5 }
  ];

  constructor(
    private examService: ExamService,
    private messageService: MessageService,
    private activated: ActivatedRoute
  ) {
    const paramExamId = this.activated.snapshot.paramMap.get('examId');
    if (paramExamId) {
      this.examId = Number(paramExamId);
    }
  }

  ngOnInit() {
    this.loadQuestions();
  }

  loadQuestions() {
    this.examService.getQuestionsByExamId(this.examId).subscribe(data => {
      this.questions = data || [];
    });
  }

  openNew() {
    this.question = { 
      examId: this.examId,
      section: 1,
      difficulty: 2,
      positiveMarks: 4,
      negativeMarks: 1,
      trueChoice: 1,
      explanation: ''
    };
    this.submitted = false;
    this.questionDialog = true;
  }

  editQuestion(question: any) {
    this.question = { 
      ...question,
      section: question.section || 1,
      difficulty: question.difficulty || 2,
      positiveMarks: question.positiveMarks || 4,
      negativeMarks: question.negativeMarks || 1
    };
    this.questionDialog = true;
  }

  deleteQuestion(question: any) {
    this.question = { ...question };
    this.deleteQuestionDialog = true;
  }

  deleteSelectedQuestions() {
    this.deleteQuestionsDialog = true;
  }

  confirmDeleteSelected() {
    const ids = this.selectedQuestions.map(q => q.id);
    this.examService.deleteQuestions(ids).subscribe(() => {
      this.questions = this.questions.filter(val => !this.selectedQuestions.includes(val));
      this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Questions Deleted', life: 3000 });
      this.selectedQuestions = [];
      this.deleteQuestionsDialog = false;
    });
  }

  confirmDelete() {
    this.examService.deleteQuestion(this.question.id).subscribe(() => {
      this.questions = this.questions.filter(val => val.id !== this.question.id);
      this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Question Deleted', life: 3000 });
      this.question = {};
      this.deleteQuestionDialog = false;
    });
  }

  hideDialog() {
    this.questionDialog = false;
    this.submitted = false;
  }

  saveQuestion() {
    this.submitted = true;
    if (this.question.question?.trim()) {
      this.question.section = Number(this.question.section || 1);
      this.question.difficulty = Number(this.question.difficulty || 2);
      this.question.trueChoice = Number(this.question.trueChoice || 1);
      this.question.positiveMarks = Number(this.question.positiveMarks || 4);
      this.question.negativeMarks = Number(this.question.negativeMarks || 1);

      if (this.question.id) {
        this.examService.updateQuestion(this.question).subscribe(() => {
          this.loadQuestions();
          this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Question Updated', life: 3000 });
          this.questionDialog = false;
          this.question = {};
        });
      } else {
        this.examService.addQuestion(this.question).subscribe(() => {
          this.loadQuestions();
          this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Question Created', life: 3000 });
          this.questionDialog = false;
          this.question = {};
        });
      }
    }
  }

  onGlobalFilter(table: any, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  getSectionLabel(sec: number): string {
    switch(sec) {
      case 1: return '📐 Quant';
      case 2: return '🧩 Reasoning';
      case 3: return '📚 Verbal';
      case 4: return '💻 Technical';
      default: return '📐 Quant';
    }
  }

  getSectionClass(sec: number): string {
    switch(sec) {
      case 1: return 'section-pill-quant';
      case 2: return 'section-pill-logical';
      case 3: return 'section-pill-verbal';
      case 4: return 'section-pill-tech';
      default: return 'section-pill-quant';
    }
  }

  getDifficultyLabel(diff: number): string {
    switch(diff) {
      case 1: return 'Easy';
      case 2: return 'Medium';
      case 3: return 'Hard';
      default: return 'Medium';
    }
  }

  getDifficultyClass(diff: number): string {
    switch(diff) {
      case 1: return 'diff-badge-easy';
      case 2: return 'diff-badge-medium';
      case 3: return 'diff-badge-hard';
      default: return 'diff-badge-medium';
    }
  }

  getTrueChoiceLetter(choice: number): string {
    const letters = ['', 'A', 'B', 'C', 'D', 'E'];
    return letters[choice] || 'A';
  }

  // =========================================================================
  // BULK QUESTION UPLOAD WORKFLOW
  // =========================================================================

  openBulkUpload() {
    this.bulkUploadDialog = true;
    this.parsedQuestions = [];
    this.pastedContent = '';
    this.parseErrorMessage = '';
  }

  downloadSampleTemplate() {
    const csvContent = 
`Question,ChoiceA,ChoiceB,ChoiceC,ChoiceD,ChoiceE,TrueChoice,Section,Difficulty,Explanation
"What is the average of the first 5 multiples of 7?","21","28","35","14","42","A","Quantitative","Easy","First 5 multiples of 7: 7, 14, 21, 28, 35. Sum = 105. Average = 105 / 5 = 21."
"Complete the number series: 2, 6, 12, 20, 30, ?","40","42","44","46","48","B","LogicalReasoning","Medium","Differences are 4, 6, 8, 10. Next difference is 12: 30 + 12 = 42."
"Select the correct antonym for EPHEMERAL:","Transient","Perpetual","Fleeting","Brief","Short","B","VerbalAbility","Easy","Ephemeral means short-lived. The antonym is Perpetual (eternal)."
"What is the time complexity of searching in a balanced AVL tree?","O(1)","O(log n)","O(n)","O(n log n)","O(n^2)","B","Technical","Medium","Height of an AVL tree is bounded by O(log n), resulting in worst-case lookup of O(log n)."`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'aptitude_questions_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const content = e.target.result;
      this.parseQuestionsContent(content);
    };
    reader.readAsText(file);
  }

  parsePastedData() {
    if (!this.pastedContent || !this.pastedContent.trim()) {
      this.parseErrorMessage = 'Please paste question data in CSV or JSON format.';
      return;
    }
    this.parseQuestionsContent(this.pastedContent.trim());
  }

  parseQuestionsContent(content: string) {
    this.parseErrorMessage = '';
    this.parsedQuestions = [];

    // Check if JSON
    if (content.trim().startsWith('[') || content.trim().startsWith('{')) {
      try {
        const rawJson = JSON.parse(content);
        const list = Array.isArray(rawJson) ? rawJson : [rawJson];
        for (const item of list) {
          const q = {
            examId: this.examId,
            question: item.question || item.Question || '',
            choiceA: item.choiceA || item.ChoiceA || '',
            choiceB: item.choiceB || item.ChoiceB || '',
            choiceC: item.choiceC || item.ChoiceC || '',
            choiceD: item.choiceD || item.ChoiceD || '',
            choiceE: item.choiceE || item.ChoiceE || '',
            trueChoice: this.normalizeChoice(item.trueChoice || item.TrueChoice || item.correctAnswer || item.answer),
            section: this.normalizeSection(item.section || item.Section),
            difficulty: this.normalizeDifficulty(item.difficulty || item.Difficulty),
            explanation: item.explanation || item.Explanation || 'Solution provided by faculty.',
            positiveMarks: Number(item.positiveMarks || item.PositiveMarks || 4.0),
            negativeMarks: Number(item.negativeMarks || item.NegativeMarks || 1.0)
          };
          if (q.question && q.choiceA && q.choiceB) {
            this.parsedQuestions.push(q);
          }
        }
      } catch (err: any) {
        this.parseErrorMessage = 'JSON parse error: ' + err.message;
        return;
      }
    } else {
      // Parse CSV
      const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length === 0) {
        this.parseErrorMessage = 'No valid rows found in CSV data.';
        return;
      }

      let startIndex = 0;
      // Skip header row if present
      const firstLineLower = lines[0].toLowerCase();
      if (firstLineLower.includes('question') || firstLineLower.includes('choice') || firstLineLower.includes('truechoice')) {
        startIndex = 1;
      }

      for (let i = startIndex; i < lines.length; i++) {
        const cols = this.parseCsvRow(lines[i]);
        if (cols.length >= 4) { // At least question, ChoiceA, ChoiceB, TrueChoice
          const qText = cols[0];
          const chA = cols[1];
          const chB = cols[2];
          const chC = cols[3] || '';
          const chD = cols[4] || '';
          const chE = cols[5] || '';
          const rawKey = cols[6] || 'A';
          const rawSec = cols[7] || '1';
          const rawDiff = cols[8] || '2';
          const expl = cols[9] || '';

          if (qText && chA) {
            this.parsedQuestions.push({
              examId: this.examId,
              question: qText,
              choiceA: chA,
              choiceB: chB,
              choiceC: chC,
              choiceD: chD,
              choiceE: chE,
              trueChoice: this.normalizeChoice(rawKey),
              section: this.normalizeSection(rawSec),
              difficulty: this.normalizeDifficulty(rawDiff),
              explanation: expl || 'Step-by-step solution provided by faculty.',
              positiveMarks: 4.0,
              negativeMarks: 1.0
            });
          }
        }
      }
    }

    if (this.parsedQuestions.length === 0) {
      this.parseErrorMessage = 'No valid questions could be extracted. Please check the template format.';
    }
  }

  parseCsvRow(line: string): string[] {
    const result: string[] = [];
    let curVal = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          curVal += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        result.push(curVal.trim());
        curVal = '';
      } else {
        curVal += char;
      }
    }
    result.push(curVal.trim());
    return result;
  }

  normalizeChoice(val: any): number {
    if (!val) return 1;
    const str = String(val).trim().toUpperCase();
    if (str === 'A' || str === '1') return 1;
    if (str === 'B' || str === '2') return 2;
    if (str === 'C' || str === '3') return 3;
    if (str === 'D' || str === '4') return 4;
    if (str === 'E' || str === '5') return 5;
    return 1;
  }

  normalizeSection(val: any): number {
    if (!val) return 1;
    const str = String(val).trim().toLowerCase();
    if (str.includes('quant') || str === '1') return 1;
    if (str.includes('logic') || str.includes('reason') || str === '2') return 2;
    if (str.includes('verb') || str.includes('english') || str === '3') return 3;
    if (str.includes('tech') || str.includes('code') || str === '4') return 4;
    return 1;
  }

  normalizeDifficulty(val: any): number {
    if (!val) return 2;
    const str = String(val).trim().toLowerCase();
    if (str.includes('easy') || str === '1') return 1;
    if (str.includes('med') || str === '2') return 2;
    if (str.includes('hard') || str === '3') return 3;
    return 2;
  }

  removeParsedQuestion(index: number) {
    this.parsedQuestions.splice(index, 1);
  }

  confirmBulkImport() {
    if (this.parsedQuestions.length === 0) return;
    this.isImporting = true;

    this.examService.bulkInsertQuestions(this.parsedQuestions).subscribe({
      next: (count) => {
        this.isImporting = false;
        this.bulkUploadDialog = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Bulk Import Succeeded',
          detail: `Successfully imported ${count} question(s) into the examination bank!`,
          life: 4000
        });
        this.loadQuestions();
      },
      error: (err) => {
        this.isImporting = false;
        console.error('Error importing bulk questions:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Import Failed',
          detail: 'Could not save bulk questions to the database. Please try again.',
          life: 4000
        });
      }
    });
  }
}
