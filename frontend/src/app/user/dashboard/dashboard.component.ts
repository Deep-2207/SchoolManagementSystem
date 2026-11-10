import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/demo/components/auth/auth.service';
import { UserModel } from 'src/app/demo/components/auth/user.model';
import { ExamService } from 'src/app/course/exam/exam.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  user: UserModel | null = null;
  liveClasses: any[] = [];
  featuredLiveClass: any = null;

  constructor(
    private authService: AuthService,
    private examService: ExamService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.user.subscribe(user => {
      this.user = user;
    });

    this.loadLiveClasses();
  }

  loadLiveClasses() {
    this.examService.getLiveClasses().subscribe({
      next: (classes) => {
        this.liveClasses = classes || [];
        if (this.liveClasses.length > 0) {
          this.featuredLiveClass = this.liveClasses[0];
        }
      },
      error: (err) => console.warn('Could not load live classes:', err)
    });
  }

  goToLiveClass(classId?: number) {
    if (classId) {
      this.router.navigate(['/user/live-class'], { queryParams: { id: classId } });
    } else {
      this.router.navigate(['/user/live-class']);
    }
  }

  goToExams() {
    this.router.navigate(['/user/index']);
  }

  goToGrades() {
    this.router.navigate(['/user/grades']);
  }

  goToProfile() {
    // Profile sayfası henüz yok, şimdilik dashboard'da kal
    console.log('Profile settings clicked');
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
