import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ExamService } from '../../course/exam/exam.service';
import { AuthService } from 'src/app/demo/components/auth/auth.service';
import { UserModel } from 'src/app/demo/components/auth/user.model';
import { MessageService } from 'primeng/api';

interface LiveChatMessage {
  id: number;
  sender: string;
  role: 'student' | 'teacher' | 'ta';
  avatar: string;
  text: string;
  timestamp: string;
  upvotes: number;
  isUpvoted?: boolean;
}

@Component({
  selector: 'app-user-live-class',
  templateUrl: './user-live-class.component.html',
  styleUrls: ['./user-live-class.component.scss'],
  providers: [MessageService]
})
export class UserLiveClassComponent implements OnInit, OnDestroy {
  liveClasses: any[] = [];
  selectedClass: any = null;
  safeVideoUrl: SafeResourceUrl | null = null;
  loading: boolean = false;
  isTheaterMode: boolean = false;
  user: UserModel | null = null;

  // Live Q&A and Chat stream
  chatMessages: LiveChatMessage[] = [];
  newChatMessage: string = '';
  activeStudentsCount: number = 34;
  private attendeeTimer: any;

  constructor(
    private examService: ExamService,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.authService.user.subscribe(user => {
      this.user = user;
    });

    this.initDefaultChat();
    this.loadLiveClasses();

    // Subtle attendee count oscillation for realistic live feel
    this.attendeeTimer = setInterval(() => {
      const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
      this.activeStudentsCount = Math.max(25, Math.min(50, this.activeStudentsCount + delta));
    }, 8000);
  }

  ngOnDestroy(): void {
    if (this.attendeeTimer) {
      clearInterval(this.attendeeTimer);
    }
  }

  loadLiveClasses(): void {
    this.loading = true;
    this.examService.getLiveClasses().subscribe({
      next: (classes) => {
        this.liveClasses = classes || [];
        this.loading = false;

        this.route.queryParams.subscribe(params => {
          const classId = params['id'] ? Number(params['id']) : null;
          if (classId) {
            const found = this.liveClasses.find(c => c.id === classId);
            if (found) {
              this.selectClass(found);
              return;
            }
          }
          // Default to first live class or class #5 (Live Class 9)
          if (this.liveClasses.length > 0) {
            const preferred = this.liveClasses.find(c => c.name?.toLowerCase().includes('live class')) || this.liveClasses[0];
            this.selectClass(preferred);
          }
        });
      },
      error: (err) => {
        console.error('Error fetching live classes:', err);
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Connection Error',
          detail: 'Could not load live classroom feeds. Please try refreshing.'
        });
      }
    });
  }

  selectClass(liveClass: any): void {
    this.selectedClass = liveClass;
    const rawUrl = liveClass.videoIframeUrl || 'https://www.youtube.com/embed/cURW_54WsY4?si=h6CNA56W7lsp9nYa';
    const embedUrl = this.normalizeVideoUrl(rawUrl);
    this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  normalizeVideoUrl(url: string): string {
    if (!url) return 'https://www.youtube.com/embed/cURW_54WsY4?si=h6CNA56W7lsp9nYa';

    // If already an embed URL, return it
    if (url.includes('/embed/')) {
      return url.includes('autoplay') ? url : (url.includes('?') ? `${url}&autoplay=1` : `${url}?autoplay=1`);
    }

    // Convert standard YouTube watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/[?&]v=([^&#]+)/);
    if (watchMatch && watchMatch[1]) {
      return `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=1`;
    }

    // Convert short youtu.be URL: https://youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([^?&#]+)/);
    if (shortMatch && shortMatch[1]) {
      return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1`;
    }

    return url;
  }

  initDefaultChat(): void {
    this.chatMessages = [
      {
        id: 1,
        sender: 'Prof. Alan Turing',
        role: 'teacher',
        avatar: 'AT',
        text: 'Welcome everyone to today\'s live classroom session! Keep your notebook and workspace ready.',
        timestamp: '10:02 AM',
        upvotes: 12
      },
      {
        id: 2,
        sender: 'Teaching Assistant (Kiran)',
        role: 'ta',
        avatar: 'TA',
        text: 'Audio and HD stream verified clear. Please type any questions regarding algorithm steps in this chat.',
        timestamp: '10:04 AM',
        upvotes: 6
      },
      {
        id: 3,
        sender: 'Marcus Chen',
        role: 'student',
        avatar: 'MC',
        text: 'Will we have the negative marking system (+4 / -1) in the upcoming quiz for this module?',
        timestamp: '10:07 AM',
        upvotes: 4
      },
      {
        id: 4,
        sender: 'Prof. Alan Turing',
        role: 'teacher',
        avatar: 'AT',
        text: 'Yes Marcus, today\'s aptitude assessment applies the standard +4 / -1 scheme. Unanswered questions incur 0 penalty.',
        timestamp: '10:09 AM',
        upvotes: 9
      }
    ];
  }

  sendChatMessage(): void {
    if (!this.newChatMessage || !this.newChatMessage.trim()) return;

    const senderName = this.user?.name || 'Student';
    const initials = senderName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const msg: LiveChatMessage = {
      id: Date.now(),
      sender: senderName,
      role: 'student',
      avatar: initials,
      text: this.newChatMessage.trim(),
      timestamp: timeStr,
      upvotes: 0
    };

    this.chatMessages.push(msg);
    this.newChatMessage = '';

    // Auto-scroll chat to bottom
    setTimeout(() => {
      const chatEl = document.getElementById('classroom-chat-feed');
      if (chatEl) {
        chatEl.scrollTop = chatEl.scrollHeight;
      }
    }, 100);
  }

  upvoteMessage(msg: LiveChatMessage): void {
    if (!msg.isUpvoted) {
      msg.upvotes++;
      msg.isUpvoted = true;
    } else {
      msg.upvotes--;
      msg.isUpvoted = false;
    }
  }

  toggleTheaterMode(): void {
    this.isTheaterMode = !this.isTheaterMode;
  }

  launchAssessment(examId: number): void {
    this.router.navigate(['/user/exam', examId]);
  }

  goToGrades(): void {
    this.router.navigate(['/user/grades']);
  }
}
