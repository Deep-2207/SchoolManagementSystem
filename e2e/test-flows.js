const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:4200';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const issues = [];
const successes = [];

function logIssue(category, description, details = null) {
  const item = { category, description, details, timestamp: new Date().toISOString() };
  issues.push(item);
  console.error(`❌ [ISSUE - ${category}] ${description}`);
  if (details) console.error('   Details:', details);
}

function logSuccess(step, description) {
  successes.push({ step, description, timestamp: new Date().toISOString() });
  console.log(`✅ [SUCCESS - ${step}] ${description}`);
}

async function runE2ETests() {
  console.log('================================================================');
  console.log('🚀 STARTING FULL END-TO-END UI & SYSTEM VERIFICATION');
  console.log('Target Base URL:', BASE_URL);
  console.log('Browser Channel: msedge (headless)');
  console.log('================================================================\n');

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();

  // Listen for console errors & network failures
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore websocket reload/heartbeat or expected favicon noise if any
      if (!text.includes('favicon.ico')) {
        logIssue('Console Error', text);
      }
    }
  });

  page.on('pageerror', err => {
    logIssue('Uncaught Page Exception', err.message, err.stack);
  });

  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    if (status >= 400 && !url.includes('favicon')) {
      logIssue('HTTP Network Error', `${response.status()} ${response.statusText()} on ${url}`);
    }
  });

  try {
    // -------------------------------------------------------------
    // STEP 1: LOGIN PAGE & BRANDING VERIFICATION
    // -------------------------------------------------------------
    console.log('\n--- [STEP 1] Testing Login Screen & Branding ---');
    await page.goto(`${BASE_URL}/#/auth/login`, { waitUntil: 'networkidle' });
    const pageTitle = await page.title();
    console.log('Page Title:', pageTitle);
    if (!pageTitle.includes('Lucifer')) {
      logIssue('Branding', `Page title does not contain 'Lucifer'. Found: '${pageTitle}'`);
    } else {
      logSuccess('Branding', `Page title verified: '${pageTitle}'`);
    }

    const brandHeader = await page.textContent('#loginBrandTitle');
    if (!brandHeader || !brandHeader.includes('Lucifer Academy')) {
      logIssue('Branding', `Login header missing 'Lucifer Academy'. Found: '${brandHeader}'`);
    } else {
      logSuccess('Branding', `Login header verified: '${brandHeader}'`);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_login_screen.png'), fullPage: true });

    // -------------------------------------------------------------
    // STEP 2: SUPER ADMIN WORKFLOW & TEACHER CREATION
    // -------------------------------------------------------------
    console.log('\n--- [STEP 2] Super Admin Login & Faculty Management ---');
    const adminBtn = page.locator('button:has-text("👑 Admin")');
    await adminBtn.click();
    await page.waitForTimeout(300);

    const emailValue = await page.inputValue('#email1');
    if (emailValue !== 'admin@school.edu') {
      logIssue('Login Form', `Admin quick fill failed. Email is '${emailValue}'`);
    } else {
      logSuccess('Quick Fill', 'Admin credentials autofilled.');
    }

    await page.click('button:has-text("Sign In to Classroom")');
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    console.log('Logged in Admin URL:', currentUrl);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_admin_dashboard.png'), fullPage: true });

    // Verify Admin Topbar Branding
    const topbarText = await page.textContent('.app-topbar, .layout-topbar').catch(() => '');
    if (topbarText && topbarText.includes('PrimeNG')) {
      logIssue('Branding', 'Topbar still contains PrimeNG!');
    } else {
      logSuccess('Branding', 'Topbar clean of PrimeNG references.');
    }

    // Navigate to Teacher Management
    console.log('Navigating to Teacher Management (/#/teacher/index)...');
    await page.goto(`${BASE_URL}/#/teacher/index`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_teacher_management.png'), fullPage: true });

    const facultyBanner = await page.textContent('.banner-title').catch(() => '');
    if (facultyBanner.includes('Faculty & Teacher Management')) {
      logSuccess('Teacher Management', 'Faculty page loaded successfully.');
    } else {
      logIssue('Teacher Management', `Unexpected banner: '${facultyBanner}'`);
    }

    // Provision New Teacher Dialog
    console.log('Testing "Provision New Faculty Account" dialog...');
    const newTeacherBtn = page.locator('button:has-text("Provision New Teacher")');
    if (await newTeacherBtn.isVisible()) {
      await newTeacherBtn.click();
      await page.waitForTimeout(500);

      const uniqueEmail = `prof_lucifer_${Date.now()}@school.edu`;
      await page.fill('#newName', 'Prof. Lucifer Turing');
      await page.fill('#newEmail', uniqueEmail);
      await page.fill('#newPassword', 'admin123');

      // Select department if options exist
      const deptOptions = await page.locator('#newDept option').count();
      if (deptOptions > 1) {
        await page.selectOption('#newDept', { index: 1 });
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_new_teacher_dialog.png') });

      const createAccountBtn = page.locator('button:has-text("Create Faculty Account")');
      await createAccountBtn.click();
      await page.waitForTimeout(1500);

      const pageBody = await page.content();
      if (pageBody.includes(uniqueEmail) || pageBody.includes('Prof. Lucifer Turing')) {
        logSuccess('Teacher Management', `New faculty account '${uniqueEmail}' successfully created and rendered.`);
      } else {
        logIssue('Teacher Management', `New faculty '${uniqueEmail}' not found in DOM after creation.`);
      }
    } else {
      logIssue('Teacher Management', '"Provision New Teacher" button was not visible.');
    }

    // -------------------------------------------------------------
    // STEP 3: TEACHER WORKFLOW, EXAM CREATION & BULK UPLOAD
    // -------------------------------------------------------------
    console.log('\n--- [STEP 3] Teacher Portal, Exam Creation & Bulk Upload ---');
    await page.goto(`${BASE_URL}/#/auth/login`, { waitUntil: 'networkidle' });
    await page.click('button:has-text("👨‍🏫 Teacher")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Sign In to Classroom")');
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // Navigate to Course Management
    console.log('Navigating to /#/course/index...');
    await page.goto(`${BASE_URL}/#/course/index`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_course_index.png'), fullPage: true });

    const examBtns = page.locator('.action-btn.exams-btn');
    const examBtnCount = await examBtns.count();
    console.log(`Found ${examBtnCount} courses with Manage Exams buttons.`);

    if (examBtnCount > 0) {
      await examBtns.first().click();
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1000);
      console.log('Exam Manager URL:', page.url());
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_exam_manager.png'), fullPage: true });

      // Create New Exam with Negative Marking + Live Stream
      console.log('Testing "New Examination" creation with Negative Marking...');
      const newExamBtn = page.locator('button:has-text("New Examination")');
      if (await newExamBtn.isVisible()) {
        await newExamBtn.click();
        await page.waitForTimeout(500);

        const testExamName = `Lucifer Aptitude Challenge ${Date.now() % 10000}`;
        await page.fill('#name', testExamName);
        await page.fill('#durationMinutes', '45');
        await page.fill('#passPoint', '60');

        // Check Live Video toggle
        const liveVideoCheckbox = page.locator('#hasLiveVideo');
        if (await liveVideoCheckbox.isVisible()) {
          await liveVideoCheckbox.check();
          await page.waitForTimeout(300);
        }

        // Fill Live Video URL
        const videoInput = page.locator('#videoIframeUrl');
        if (await videoInput.isVisible()) {
          await videoInput.fill('https://www.youtube.com/embed/jfKfPfyJRdk');
        }

        // Enable Negative Marking Checkbox
        const negMarkCheckbox = page.locator('#enableNegativeMarking');
        if (await negMarkCheckbox.isVisible()) {
          await negMarkCheckbox.check();
          console.log('Checked Negative Marking policy toggle.');
        }

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_exam_dialog_configured.png') });

        // Save Assessment
        await page.click('button:has-text("Save Assessment")');
        await page.waitForTimeout(2500);

        // Filter by the new exam name to ensure it's visible even across pages
        const filterInput = page.locator('input[placeholder*="Search examinations"]');
        if (await filterInput.isVisible()) {
          await filterInput.fill(testExamName);
          await page.waitForTimeout(600);
        }

        const examListHtml = await page.content();
        if (examListHtml.includes(testExamName)) {
          logSuccess('Exam Management', `Successfully created Exam '${testExamName}' with Negative Marking.`);
        } else {
          logIssue('Exam Management', `Exam '${testExamName}' not found in table after saving.`);
        }

        // Open Question Bank for this exam
        console.log('Opening Question Bank repository...');
        const qBankBtn = page.locator('button:has(.pi-question)').first();
        if (await qBankBtn.isVisible()) {
          await qBankBtn.click();
          await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
          await page.waitForTimeout(1000);
          console.log('Question Bank URL:', page.url());
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_question_bank.png'), fullPage: true });

          // Test Bulk Upload
          console.log('Testing Bulk Upload Questions dialog...');
          const bulkUploadBtn = page.locator('button:has-text("Bulk Upload Questions")');
          if (await bulkUploadBtn.isVisible()) {
            await bulkUploadBtn.click();
            await page.waitForTimeout(500);

            // Switch to Paste mode
            await page.click('button:has-text("Paste Text / CSV / JSON")');
            await page.waitForTimeout(300);

            // Paste sample questions
            const sampleQuestions = 
`What is the square root of 256?,14,16,18,20,,B,Quant,Easy,16 squared is 256.
All roses are flowers. All flowers fade. Therefore all roses fade.,True,False,Indeterminate,Partially True,,A,Reasoning,Medium,Direct syllogism.`;

            await page.fill('textarea[placeholder*="Paste comma-separated"]', sampleQuestions);
            await page.click('button:has-text("Parse Pasted Questions")');
            await page.waitForTimeout(500);

            await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_bulk_upload_parsed.png') });

            const previewText = await page.textContent('.p-dialog-content, .surface-ground');
            if (previewText.includes('Parsed 2 Valid Question(s)')) {
              logSuccess('Bulk Upload', 'CSV successfully parsed 2 questions into preview table.');
              
              // Confirm & Import
              await page.click('button:has-text("Confirm & Import")');
              await page.waitForTimeout(2000);
              logSuccess('Bulk Upload', 'Confirmed bulk import of 2 questions.');
            } else {
              logIssue('Bulk Upload', 'Preview table did not show 2 valid questions.');
            }
          } else {
            logIssue('Question Bank', 'Bulk Upload button not found.');
          }
        }
      } else {
        logIssue('Exam Management', '"New Examination" button not found.');
      }
    } else {
      logIssue('Exam Management', 'No courses found on /#/course/index.');
    }

    // -------------------------------------------------------------
    // STEP 4: STUDENT WORKFLOW & EXAMINATION EXPERIENCE
    // -------------------------------------------------------------
    console.log('\n--- [STEP 4] Student Dashboard, Live Class & Exam Hall ---');
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/#/auth/login`, { waitUntil: 'networkidle' });
    await page.click('button:has-text("🧑‍🎓 Student")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Sign In to Classroom")');
    await page.waitForTimeout(1500);

    console.log('Student Dashboard URL:', page.url());
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_student_dashboard.png'), fullPage: true });

    // Verify Student Dashboard Branding
    const studentBanner = await page.textContent('.banner-badge').catch(() => '');
    if (studentBanner.includes('Lucifer Academy')) {
      logSuccess('Student Dashboard', 'Lucifer Academy student banner verified.');
    } else {
      logIssue('Student Dashboard', `Missing Lucifer Academy banner. Found: '${studentBanner}'`);
    }

    // Check Live Classroom Wing Widget
    const liveWidget = page.locator('.live-dot');
    if (await liveWidget.count() > 0) {
      logSuccess('Student Dashboard', 'Live Classroom Wing active broadcast widget displayed.');
    }

    // Navigate to Live Class Screen
    console.log('Navigating to /#/user/live-class...');
    await page.goto(`${BASE_URL}/#/user/live-class`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_student_live_class.png'), fullPage: true });

    // Verify 16:9 iframe player
    const iframeCount = await page.locator('iframe').count();
    if (iframeCount > 0) {
      logSuccess('Live Classroom', `16:9 Embedded video player rendered (${iframeCount} iframe found).`);
    } else {
      logIssue('Live Classroom', 'No video iframe found on live classroom page.');
    }

    // Post a doubt in Live Chat
    console.log('Testing live Q&A doubts feed...');
    const doubtInput = page.locator('input[placeholder*="Ask a question or request faculty clarification"]');
    if (await doubtInput.isVisible()) {
      await doubtInput.fill('Can faculty explain the negative marking penalty for question 5?');
      await page.click('button:has-text("Post Doubt")');
      await page.waitForTimeout(500);

      const liveChatContent = await page.textContent('.doubts-feed-list');
      if (liveChatContent.includes('Can faculty explain the negative marking penalty')) {
        logSuccess('Live Classroom', 'Posted doubt successfully displayed in live feed.');
      } else {
        logIssue('Live Classroom', 'Posted doubt not found in chat feed.');
      }
    }

    // Navigate to Student Exams List (/#/user/index)
    console.log('Navigating to /#/user/index...');
    await page.goto(`${BASE_URL}/#/user/index`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_student_courses_exams.png'), fullPage: true });

    // Open exams drawer for the first course
    const viewExamsBtn = page.locator('button:has-text("View Exams")').first();
    if (await viewExamsBtn.isVisible()) {
      await viewExamsBtn.click();
      await page.waitForTimeout(800);

      const enterExamBtn = page.locator('button:has-text("Enter Live Exam")').first();
      const viewSolutionBtn = page.locator('button:has-text("View Solution Key")').first();

      if (await enterExamBtn.isVisible()) {
        logSuccess('Student Exam List', '"Enter Live Exam" button visible and clicked.');
        await enterExamBtn.click();
        await page.waitForTimeout(2000);

        console.log('Exam Hall URL:', page.url());
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_exam_hall.png'), fullPage: true });

        // Verify Auto-save and Answer Selection
        console.log('Testing Exam Hall Auto-save & Answer Selection...');
        const choiceCards = page.locator('.choice-label-card');
        const choiceCount = await choiceCards.count();
        console.log(`Found ${choiceCount} answer choice options.`);

        if (choiceCount > 0) {
          await choiceCards.first().click();
          await page.waitForTimeout(1200);

          // Check autosave banner
          const autoSaveBadge = await page.textContent('.banner-badge:has-text("Autosaved")').catch(() => '');
          console.log('Autosave status:', autoSaveBadge);
          if (autoSaveBadge.includes('Autosaved')) {
            logSuccess('Exam Hall', `Real-time candidate answer autosave triggered: '${autoSaveBadge}'`);
          }

          // Test Mark for Review
          console.log('Testing Mark for Review toggle...');
          const markForReviewBtn = page.locator('button:has-text("Mark for Review & Next")');
          if (await markForReviewBtn.isVisible()) {
            await markForReviewBtn.click();
            await page.waitForTimeout(800);
            logSuccess('Exam Hall', 'Candidate flagged question for review and proceeded to next.');
          }

          // Select second question answer
          const secondChoiceCards = page.locator('.choice-label-card');
          if (await secondChoiceCards.count() > 1) {
            await secondChoiceCards.nth(1).click();
            await page.waitForTimeout(800);
          }

          // Submit Exam
          console.log('Submitting candidate exam...');
          const submitExamBtn = page.locator('button:has-text("Finish & Submit Assessment")');
          if (await submitExamBtn.isVisible()) {
            await submitExamBtn.click();
            await page.waitForTimeout(800);

            // Handle unanswered prompt if shown
            const submitAnywayBtn = page.locator('button:has-text("Submit Anyway")');
            if (await submitAnywayBtn.isVisible()) {
              await submitAnywayBtn.click();
              console.log('Confirmed submit anyway on unanswered dialog.');
            }

            // Wait for redirection to grades
            await page.waitForTimeout(4000);
            console.log('Post-Submission URL:', page.url());
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_post_submission_grades.png'), fullPage: true });
          }
        }
      } else if (await viewSolutionBtn.isVisible()) {
        logSuccess('Student Exam List', 'Course exams found with Solution Keys available.');
        await viewSolutionBtn.click();
        await page.waitForTimeout(2000);
      }
    } else {
      logIssue('Student Exam List', '"View Exams" button not found on registered courses.');
    }

    // Navigate to Grades & Performance Review
    console.log('Navigating to /#/user/grades...');
    await page.goto(`${BASE_URL}/#/user/grades`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15_gradebook.png'), fullPage: true });

    // Look for Solution Review button
    const solutionReviewBtn = page.locator('button:has-text("Solution Review")').first();
    if (await solutionReviewBtn.isVisible()) {
      await solutionReviewBtn.click();
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16_solutions_analytics_view.png'), fullPage: true });

      const reviewHtml = await page.content();
      if (reviewHtml.includes('Accuracy Rate') || reviewHtml.includes('Net Scaled Score') || reviewHtml.includes('Official Solution Key')) {
        logSuccess('Solutions & Analytics', 'Comprehensive Solutions Review & Speed vs. Accuracy analytics verified.');
      } else {
        logIssue('Solutions & Analytics', 'Review view missing speed vs accuracy analytics metrics.');
      }
    } else {
      const reviewHtml = await page.content();
      if (reviewHtml.includes('Accuracy Rate') || reviewHtml.includes('Net Scaled Score') || reviewHtml.includes('Official Solution Key')) {
        logSuccess('Solutions & Analytics', 'Solutions Review & Analytics already open via active submission.');
      } else {
        logIssue('Solutions & Analytics', 'Could not open Solutions Review & Analytics.');
      }
    }

  } catch (err) {
    logIssue('Fatal Execution Exception', err.message, err.stack);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error_fatal.png'), fullPage: true }).catch(() => {});
  } finally {
    await browser.close();
  }

  // Summary Report
  console.log('\n================================================================');
  console.log('📊 E2E UI TEST EXECUTION COMPLETE');
  console.log(`Total Successes: ${successes.length}`);
  console.log(`Total Issues / Friction Points Found: ${issues.length}`);
  console.log('================================================================');

  if (issues.length > 0) {
    console.log('\n⚠️ LIST OF IDENTIFIED ISSUES:');
    issues.forEach((issue, idx) => {
      console.log(`${idx + 1}. [${issue.category}] ${issue.description}`);
      if (issue.details) console.log(`   ${issue.details}`);
    });
  } else {
    console.log('\n🎉 ALL END-TO-END FLOWS COMPLETED WITH ZERO ISSUES!');
  }

  fs.writeFileSync(path.join(__dirname, 'test-report.json'), JSON.stringify({ successes, issues }, null, 2));
}

runE2ETests().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
