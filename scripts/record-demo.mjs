/** Records the real UI. Requires a running app and `npx playwright install chromium ffmpeg`. */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const base = process.env.STUDYBRIEF_DEMO_URL || 'http://localhost:3201';
const offline = process.env.STUDYBRIEF_OFFLINE_URL;
const output = path.resolve(process.env.STUDYBRIEF_RECORDING_DIR || 'docs/.recordings');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, recordVideo: { dir: output, size: { width: 1440, height: 1000 } }, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
const page = await context.newPage();
const start = Date.now();
const chapters = [];
const diagnostics = [];
page.on('pageerror', (error) => diagnostics.push(error.message));
const hold = (ms = 2200) => page.waitForTimeout(ms);
async function caption(title, detail, delay = 2200) {
  chapters.push({ seconds: (Date.now() - start) / 1000, title, detail });
  console.log(`DEMO: ${title}`);
  await page.evaluate(({ title, detail }) => {
    let el = document.getElementById('recording-caption');
    if (!el) {
      el = document.createElement('div'); el.id = 'recording-caption';
      el.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:2147483647;background:#102f2c;color:#fff;padding:18px 46px;font:16px/1.5 system-ui;box-shadow:0 -2px 12px #0002;pointer-events:none';
      document.body.append(el); document.body.style.paddingBottom = '120px';
    }
    el.replaceChildren();
    const heading = document.createElement('strong'); heading.textContent = title; heading.style.cssText = 'display:block;font-size:21px;color:#a9ecd2';
    const description = document.createElement('div'); description.textContent = detail;
    el.append(heading, description);
  }, { title, detail });
  await hold(delay);
}
async function focus(selector) {
  await page.locator(selector).first().evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  await hold(600);
}
async function generate(button) {
  const pending = page.waitForResponse((res) => res.url().endsWith('/api/brief') && res.request().method() === 'POST', { timeout: 120000 });
  await page.getByRole('button', { name: button, exact: true }).click();
  const response = await pending;
  const data = await response.json();
  if (!response.ok()) throw new Error(`Generation failed (${response.status()}): ${data.error}`);
  return data;
}

try {
  if (process.env.STUDYBRIEF_OFFLINE_ONLY !== "1") {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.getByTestId('mode-pill').waitFor();
  await caption('StudyBrief · notes to lasting recall', 'A real browser walkthrough: source-linked practice, confidence, evidence and saved reviews.', 4000);
  await page.getByRole('button', { name: 'Notes: French Revolution', exact: true }).click();
  await caption('1 · Bring your class notes', 'Notes mode stays tied to your source. The overview is AI-generated; practice quotes are checked against your notes.', 3500);
  const data = await generate('Build revision session');
  if (data.source !== 'bharatcode') throw new Error('The main recording requires real BharatCode generation; use the separate offline chapter for mock mode.');
  await writeFile(path.join(output, 'live-response.json'), JSON.stringify(data, null, 2));
  await focus('.library');
  await caption('2 · A personal revision session', `${data.brief.practice.length} questions generated live with BharatCode. Your notes and progress are saved in this browser.`, 3500);
  await page.getByRole('button', { name: 'Practice all', exact: true }).click();
  await focus('.practice-panel');
  for (let i = 0; i < data.brief.practice.length; i++) {
    const q = data.brief.practice[i];
    const index = i === 0 ? (q.correctIndex + 1) % 4 : q.correctIndex;
    const confidence = i === 0 ? 'Very sure' : i === 1 ? 'Guessing' : 'Somewhat sure';
    await page.locator('.choice-list input').nth(index).check();
    await page.getByRole('radio', { name: confidence, exact: true }).check();
    if (i === 0) await caption('3 · Confidence before feedback', 'For this demonstration, we deliberately choose a wrong answer with high confidence.', 3500);
    else if (i === 1) await caption('Answer correctly, but admit uncertainty', 'Confidence changes the next review interval. Every question can be scored only once per round.', 2500);
    await page.getByRole('button', { name: 'Check answer', exact: true }).click();
    await focus('.feedback');
    if (i === 0) {
      await caption('4 · Reveal the misconception and evidence', 'The exact quote is present in the notes. Quote matching helps inspection; it does not prove the AI’s interpretation.', 5000);
      await page.getByText('Read the full original notes', { exact: true }).click();
      await focus('.source-notes'); await hold(3500);
      await page.getByText('Read the full original notes', { exact: true }).click();
    } else await hold(1500);
    await page.getByRole('button', { name: i + 1 === data.brief.practice.length ? 'See session results' : 'Next question', exact: true }).click();
  }
  await focus('.practice-panel');
  await caption('5 · A transparent round result', 'A practice score and confident-mistake count, without claiming mastery or improved learning.', 4500);
  await page.getByRole('button', { name: 'Close practice', exact: true }).click();
  await page.reload({ waitUntil: 'networkidle' });
  await focus('.library');
  await caption('6 · Reload: your progress survives', 'Missed concepts remain visible. Wrong answers return in 10 minutes; correct answers return in 1–14 days.', 5000);
  if (!(await page.getByRole('button', { name: 'Review due', exact: true }).isDisabled())) throw new Error('All attempted questions should have future review dates.');
  await caption('Review due respects the schedule', 'The button is disabled until a question is due. No clock or saved due dates are altered in this recording.', 3500);
  // Topic mode keeps the original product features available alongside the revision workflow.
  await page.getByRole('button', { name: 'Binary search', exact: true }).click();
  await focus('.input');
  await caption('7 · Explore a topic', 'General-knowledge briefs remain available. Topic mode does not claim source verification or create a review session.', 3000);
  await generate('Generate study brief');
  await focus('.toolbar');
  await caption('8 · A readable study brief', 'Key points, a simple explanation and important terms, powered by the live BharatCode model.', 3500);
  await focus('.terms'); await hold(3500);
  await page.getByLabel("Explain like I'm 15").check();
  await focus('.eli');
  await caption('Explain like I’m 15', 'An everyday analogy helps make an unfamiliar topic more approachable.', 4000);
  await focus('.quiz');
  await page.locator('.flip').first().click();
  await caption('9 · Flip-card practice', 'Explore the original question-and-answer cards. Saved confidence-based revision is available in notes mode.', 4000);
  await page.getByRole('button', { name: 'Copy Markdown', exact: true }).click();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  if (!clipboard.includes('## Key points')) throw new Error('Markdown clipboard export missing');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .md', exact: true }).click();
  const download = await downloadEvent;
  await download.saveAs(path.join(output, download.suggestedFilename()));
  await focus('.toolbar');
  await caption('10 · Copy or download your brief', 'Markdown export includes key points, terms, questions, ELI15 and source-linked practice when available.', 4000);
  await focus('.library');
  await page.getByRole('button', { name: /^Delete / }).click();
  await caption('11 · Delete saved notes and progress', 'Remove a session from browser storage. There is no account or cross-device sync.', 4000);
  await page.getByRole('textbox', { name: 'Topic or text' }).fill('x'.repeat(12001));
  await focus('.input');
  await caption('Input limits with clear feedback', 'Long inputs are rejected before generation. Notes mode also requires enough material to create questions.', 3000);
  await page.getByRole('button', { name: 'Notes: French Revolution', exact: true }).click();
  }
  if (offline) {
    await page.goto(offline, { waitUntil: 'networkidle' });
    await page.getByTestId('mode-pill').waitFor();
    await caption('12 · Clearly labelled offline mode', 'A separate server has no live generation enabled. Offline samples demonstrate mechanics, not model quality.', 4500);
    await page.getByRole('button', { name: 'Notes: French Revolution', exact: true }).click();
    const sample = await generate('Build revision session');
    if (sample.source !== 'mock') throw new Error('Offline chapter must show mock mode');
    await focus('.library');
    await caption('Offline samples stay visibly labelled', 'Students can try the workflow without a key. Real assessments require live BharatCode generation.', 4000);
  }
  await page.goto(base, { waitUntil: 'networkidle' });
  await caption('StudyBrief · attempt → inspect → revisit', 'Open source · BharatCode Build League · source-linked practice and a personal review loop.', 5500);
  if (diagnostics.length) throw new Error(`Browser errors: ${diagnostics.join('; ')}`);
} finally {
  await writeFile(path.join(output, 'chapters.json'), JSON.stringify(chapters, null, 2));
  await writeFile(path.join(output, 'diagnostics.json'), JSON.stringify(diagnostics));
  const video = page.video();
  await context.close();
  console.log(`VIDEO: ${await video.path()}`);
  await browser.close();
}
