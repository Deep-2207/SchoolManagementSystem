const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:4200';
const VIDEO_DIR = path.join(__dirname, 'demo-video');
if (!fs.existsSync(VIDEO_DIR)) {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
}

async function recordPOCDemo() {
  console.log('🎬 Launching browser to record Client POC Demo Video...');

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const context = await browser.newContext({
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: 1280, height: 720 }
    },
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();

  // Helper for human-like typing
  async function slowType(selector, text, delay = 35) {
    await page.fill(selector, '');
    for (const char of text) {
      await page.type(selector, char, { delay });
    }
  }

  try {
    // =========================================================
    // SCENE 1: LOGIN & LUCIFER ACADEMY BRANDING (0:00 - 0:15)
    // =========================================================
    console.log('Recording Scene 1: Lucifer Academy Login Portal...');
    await page.goto(`${BASE_URL}/#/auth/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);

    // =========================================================
    // SCENE 2: SUPER ADMIN & TEACHER PROVISIONING (0:15 - 0:40)
    // =========================================================
    console.log('Recording Scene 2: Super Admin Faculty Provisioning...');
    await page.click('button:has-text("👑 Admin")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Sign In to Classroom")');
    await page.waitForTimeout(2000);

    // Show Admin Dashboard
    await page.waitForTimeout(2000);

    // Navigate to Teacher Management
    await page.goto(`${BASE_URL}/#/teacher/index`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Open Provision New Teacher Dialog
    await page.click('button:has-text("Provision New Teacher")');
    await page.waitForTimeout(1200);

    const facultyEmail = `prof_alan_${Date.now() % 1000}@school.edu`;
    await slowType('#newName', 'Prof. Alan Turing');
    await page.waitForTimeout(400);
    await slowType('#newEmail', facultyEmail);
    await page.waitForTimeout(400);
    await slowType('#newPassword', 'admin123');
    await page.waitForTimeout(500);

    if (await page.locator('#newDept option').count() > 1) {
      await page.selectOption('#newDept', { index: 1 });
      await page.waitForTimeout(600);
    }

    await page.click('button:has-text("Create Faculty Account")');
    await page.waitForTimeout(2500);

    // =========================================================
    // SCENE 3: TEACHER - NEGATIVE MARKING & LIVE VIDEO (0:40 - 1:15)
    // =========================================================
    console.log('Recording Scene 3: Teacher Portal, Exam Creation & Live Stream...');
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/#/auth/login`, { waitUntil: 'networkidle' });
    await page.click('button:has-text("👨‍🏫 Teacher")');
    await page.waitForTimeout(800);
    await page.click('button:has-text("Sign In to Classroom")');
    await page.waitForTimeout(2000);

    // Open Courses
    await page.goto(`${BASE_URL}/#/course/index`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Open Exams for course 1
    const examBtns = page.locator('.action-btn.exams-btn');
    if (await examBtns.count() > 0) {
      await examBtns.first().click();
      await page.waitForTimeout(2000);

      // Create new examination
      await page.click('button:has-text("New Examination")');
      await page.waitForTimeout(1500);

      const challengeName = `CAT-2026 Aptitude Challenge #${Math.floor(Math.random() * 900 + 100)}`;
      await slowType('#name', challengeName);
      await page.waitForTimeout(500);

      // Configure Live Video
      const liveCheck = page.locator('#hasLiveVideo');
      if (await liveCheck.isVisible()) {
        await liveCheck.check();
        await page.waitForTimeout(800);
        await page.fill('#videoIframeUrl', 'https://www.youtube.com/embed/cURW_54WsY4?si=h6CNA56W7lsp9nYa');
        await page.waitForTimeout(600);
      }

      // Configure Negative Marking
      const negCheck = page.locator('#enableNegativeMarking');
      if (await negCheck.isVisible()) {
        await negCheck.check();
        await page.waitForTimeout(1200);
      }

      await page.click('button:has-text("Save Assessment")');
      await page.waitForTimeout(2500);

      // =========================================================
      // SCENE 4: BULK CSV QUESTION UPLOAD (1:15 - 1:45)
      // =========================================================
      console.log('Recording Scene 4: Bulk CSV Question Upload...');
      const qBankBtn = page.locator('button:has(.pi-question)').first();
      if (await qBankBtn.isVisible()) {
        await qBankBtn.click();
        await page.waitForTimeout(2000);

        // Open Bulk Upload modal
        await page.click('button:has-text("Bulk Upload Questions")');
        await page.waitForTimeout(1200);

        // Switch to Paste mode
        await page.click('button:has-text("Paste Text / CSV / JSON")');
        await page.waitForTimeout(800);

        const sampleBatch = 
`Question,ChoiceA,ChoiceB,ChoiceC,ChoiceD,ChoiceE,TrueChoice,Section,Difficulty,Explanation
"If 3x + 5 = 20, what is the value of 6x - 2?","28","30","26","32","24","A","Quantitative","Easy","From 3x = 15, we get x = 5. Therefore 6(5) - 2 = 28."
"Find next in series: 7, 14, 28, 56, ?","112","108","98","120","116","A","LogicalReasoning","Medium","Each number is multiplied by 2. 56 * 2 = 112."
"Choose the antonym of BENEVOLENT:","Malevolent","Generous","Kind","Altruistic","Selfless","A","VerbalAbility","Easy","Benevolent means well-meaning. Malevolent means having evil intent."`;

        await slowType('textarea[placeholder*="Paste comma-separated"]', sampleBatch, 5);
        await page.waitForTimeout(1000);

        await page.click('button:has-text("Parse Pasted Questions")');
        await page.waitForTimeout(2000);

        // Confirm & Import
        await page.click('button:has-text("Confirm & Import")');
        await page.waitForTimeout(2500);
      }
    }

    // =========================================================
    // SCENE 5: STUDENT CLASSROOM & LIVE VIDEO (1:45 - 2:10)
    // =========================================================
    console.log('Recording Scene 5: Student Classroom Wing & Live Stream...');
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/#/auth/login`, { waitUntil: 'networkidle' });
    await page.click('button:has-text("🧑‍🎓 Student")');
    await page.waitForTimeout(800);
    await page.click('button:has-text("Sign In to Classroom")');
    await page.waitForTimeout(2000);

    // View Student Dashboard
    await page.waitForTimeout(2000);

    // Open Live Classrooms & Lectures
    await page.goto(`${BASE_URL}/#/user/live-class`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);

    // Post live doubt
    const doubtInput = page.locator('input[placeholder*="Ask a question or request faculty clarification"]');
    if (await doubtInput.isVisible()) {
      await slowType('input[placeholder*="Ask a question or request faculty clarification"]', 'Could professor review the negative scoring impact on Section 2?');
      await page.waitForTimeout(600);
      await page.click('button:has-text("Post Doubt")');
      await page.waitForTimeout(2000);
    }

    // =========================================================
    // SCENE 6: LIVE EXAM HALL, AUTOSAVE & MARK FOR REVIEW (2:10 - 2:40)
    // =========================================================
    console.log('Recording Scene 6: Live Exam Hall with Autosave & Mark for Review...');
    await page.goto(`${BASE_URL}/#/user/index`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Open exams drawer
    await page.click('button:has-text("View Exams")');
    await page.waitForTimeout(1200);

    const enterExamBtn = page.locator('button:has-text("Enter Live Exam")').first();
    if (await enterExamBtn.isVisible()) {
      await enterExamBtn.click();
      await page.waitForTimeout(2500);

      // Select Answer (Trigger Real-time Autosave)
      const choiceCards = page.locator('.choice-label-card');
      if (await choiceCards.count() > 0) {
        await choiceCards.first().click();
        await page.waitForTimeout(1500); // Highlight Autosaved badge
      }

      // Mark for Review & Next
      const markBtn = page.locator('button:has-text("Mark for Review & Next")');
      if (await markBtn.isVisible()) {
        await markBtn.click();
        await page.waitForTimeout(1500);
      }

      // Select another answer
      const choiceCardsQ2 = page.locator('.choice-label-card');
      if (await choiceCardsQ2.count() > 1) {
        await choiceCardsQ2.nth(1).click();
        await page.waitForTimeout(1500);
      }

      // Submit Assessment
      await page.click('button:has-text("Finish & Submit Assessment")');
      await page.waitForTimeout(1200);

      const submitAnyway = page.locator('button:has-text("Submit Anyway")');
      if (await submitAnyway.isVisible()) {
        await submitAnyway.click();
        await page.waitForTimeout(3000);
      }
    }

    // =========================================================
    // SCENE 7: COMPREHENSIVE PERFORMANCE & SOLUTION KEYS (2:40 - 3:05)
    // =========================================================
    console.log('Recording Scene 7: Performance Review & Step-by-Step Solutions...');
    await page.goto(`${BASE_URL}/#/user/grades`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const reviewBtn = page.locator('button:has-text("Solution Review")').first();
    if (await reviewBtn.isVisible()) {
      await reviewBtn.click();
      await page.waitForTimeout(2500);
    }

    // Smooth scroll through solutions and speed analytics
    await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollBy({ top: 450, behavior: 'smooth' }));
    await page.waitForTimeout(3000);

    console.log('🎉 Recording complete. Flushing video buffer...');
  } catch (err) {
    console.error('Error during recording:', err);
  } finally {
    const video = page.video();
    await page.close();
    await context.close();
    await browser.close();

    if (video) {
      const videoPath = await video.path();
      const targetPath = path.join(VIDEO_DIR, 'lucifer_poc_walkthrough.webm');
      fs.copyFileSync(videoPath, targetPath);
      console.log(`✅ Production POC Demo Video saved to: ${targetPath}`);
    }
  }
}

recordPOCDemo();
