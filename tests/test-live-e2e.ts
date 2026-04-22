/// <reference lib="dom" />
/**
 * Do11y live E2E test runner.
 *
 * Drives headless Puppeteer against real hosted documentation sites, injects
 * do11y.js + Do11yConfig via evaluateOnNewDocument so the script runs on
 * every page load without touching the remote server. Then queries the Axiom
 * API to verify that the expected events were ingested.
 *
 * Covers all frameworks from test-live-sites.ts, including hosted platforms
 * like Document360 that cannot be run locally.
 *
 * Required (set in .env in this directory):
 *   AXIOM_DOMAIN  — Axiom edge domain (e.g. us-east-1.aws.edge.axiom.co)
 *   AXIOM_TOKEN   — API token with ingest + query permissions
 *   AXIOM_DATASET — Dataset name
 *
 * Optional (can override in .env or shell):
 *   FRAMEWORKS  — Comma-separated list of frameworks to test (default: all)
 *   SKIP_BUILD  — "1" skips the dist/do11y.js build step
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '.env') });

import { execSync } from 'child_process';
import fs from 'fs';
import type { Browser, Page } from 'puppeteer';

const AXIOM_DOMAIN  = process.env.AXIOM_DOMAIN!;
const AXIOM_TOKEN   = process.env.AXIOM_TOKEN!;
const AXIOM_DATASET = process.env.AXIOM_DATASET!;
const SKIP_BUILD    = process.env.SKIP_BUILD === '1';

const DO11Y_SRC = path.resolve(__dirname, '../dist/do11y.js');

// ─── Types ────────────────────────────────────────────────────────────────────

interface LiveSite {
  /** Page to open first. Pick one with code blocks and a TOC. */
  startUrl: string;
  /** Page to navigate to for the second page_view. Same domain. */
  secondUrl: string;
}

interface AxiomEvent {
  eventType?: string;
  testFramework?: string;
  [key: string]: unknown;
}

interface EventExpectation {
  min: number;
}

// ─── Live sites ───────────────────────────────────────────────────────────────

const LIVE_SITES: Record<string, LiveSite> = {
  mintlify: {
    startUrl:  'https://axiom.co/docs/query-data/explore',
    secondUrl: 'https://axiom.co/docs/reference/datasets',
  },
  docusaurus: {
    startUrl:  'https://docusaurus.io/docs/configuration',
    secondUrl: 'https://docusaurus.io/docs/installation',
  },
  nextra: {
    startUrl:  'https://nextra.site/docs/docs-theme/start',
    secondUrl: 'https://nextra.site/docs/docs-theme/page-configuration',
  },
  'mkdocs-material': {
    startUrl:  'https://squidfunk.github.io/mkdocs-material/getting-started/',
    secondUrl: 'https://squidfunk.github.io/mkdocs-material/installation/',
  },
  vitepress: {
    startUrl:  'https://vitepress.dev/guide/getting-started',
    secondUrl: 'https://vitepress.dev/guide/what-is-vitepress',
  },
  document360: {
    startUrl:  'https://docs.document360.com/docs/custom-css-javascript',
    secondUrl: 'https://docs.document360.com/docs/css-snippets',
  },
};

// ─── Expected events ─────────────────────────────────────────────────────────
//
// min: 0 for events that depend on page content we cannot control
// (code blocks with copy buttons, <details> elements, feedback widgets, TOC).
// The events that must fire regardless of which page we land on are required.

const EXPECTED_EVENTS: Record<string, EventExpectation> = {
  page_view:       { min: 2 },  // startUrl + secondUrl
  scroll_depth:    { min: 1 },
  link_click:      { min: 1 },
  page_exit:       { min: 1 },
  section_visible: { min: 1 },  // sectionVisibleThreshold: 1 + 2 s dwell
  search_opened:   { min: 0 },
  code_copied:     { min: 0 },
  toc_click:       { min: 0 },
  expand_collapse: { min: 0 },
  feedback:        { min: 0 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string):  void { console.log(`\x1b[36m[runner]\x1b[0m ${msg}`); }
function warn(msg: string): void { console.log(`\x1b[33m[runner]\x1b[0m ${msg}`); }
function fail(msg: string): void { console.log(`\x1b[31m[runner]\x1b[0m ${msg}`); }
function sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }

// ─── Build ────────────────────────────────────────────────────────────────────

function ensureBuild(): void {
  if (SKIP_BUILD) {
    log('SKIP_BUILD=1 — skipping build step');
    if (!fs.existsSync(DO11Y_SRC)) {
      fail('dist/do11y.js not found and SKIP_BUILD=1. Run `npm run build` in the repo root first.');
      process.exit(1);
    }
    return;
  }
  log('Building dist/do11y.js from source…');
  execSync('npm run build', {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
  });
  log('Build complete\n');
}

// ─── Injection ────────────────────────────────────────────────────────────────

/**
 * Runs before any page script on every navigation in the browser context,
 * bypassing the site's own CSP. Sets up Do11yConfig, stamps testRunId on
 * every ingest request, and evaluates the do11y source.
 *
 * Built as a plain string — the same approach as patchDo11y() in
 * test-integrations.ts — so the browser-context code is never type-checked
 * against the Node.js tsconfig.
 */
async function injectDo11y(
  page: Page,
  name: string,
  testRunId: string,
): Promise<void> {
  const do11ySource = fs.readFileSync(DO11Y_SRC, 'utf8');

  const configBlock = `window.Do11yConfig = {
  axiomHost: '${AXIOM_DOMAIN.trim()}',
  axiomDataset: '${AXIOM_DATASET.trim()}',
  axiomToken: '${AXIOM_TOKEN.trim()}',
  framework: '${name}',
  debug: true,
  allowedDomains: null,
  sectionVisibleThreshold: 1,
};\n`;

  const interceptBlock = `(function () {
  var _fetch = window.fetch.bind(window);
  window.fetch = function (url, opts) {
    if (typeof url === 'string' && url.includes('/v1/ingest/') && opts && opts.body) {
      try {
        var events = JSON.parse(opts.body);
        events = events.map(function (e) {
          return Object.assign({}, e, {
            testRunId: '${testRunId}',
            testFramework: '${name}',
          });
        });
        opts = Object.assign({}, opts, { body: JSON.stringify(events) });
      } catch (_e) { /* ignore */ }
    }
    return _fetch(url, opts);
  };
}());\n`;

  await page.evaluateOnNewDocument(configBlock + interceptBlock + do11ySource);
}

// ─── Interactions ─────────────────────────────────────────────────────────────

const TOC_SELECTORS = [
  '#table-of-contents',
  '[data-testid="table-of-contents"]',
  '.table-of-contents',
  '.VPDocAsideOutline',
  '.md-sidebar--secondary .md-nav',
  '[class*="article-toc"]',
  '[class*="toc"]',
  '[class*="outline"]',
  '[class*="TableOfContents"]',
  'aside.toc',
];

const SEARCH_SEL =
  '#search-bar-entry, .DocSearch-Button, .nextra-search input, ' +
  '[data-testid*="search"], .md-search__input, .VPNavBarSearchButton, ' +
  '[class*="search-input"], button[aria-label*="search" i]';

const COPY_SEL =
  'button.clean-btn[aria-label*="copy" i], button[class*="copyButton"], ' +
  '[class*="copy"], button[aria-label*="copy" i], button[title*="copy" i], ' +
  '.md-clipboard, .md-code__button[title="Copy to clipboard"], ' +
  '.vp-code-copy, button.copy[title*="Copy"]';

const FEEDBACK_SEL =
  '[class*="feedback"], [class*="helpful"], [data-feedback], ' +
  '[class*="was-article-helpful"], [class*="helpfulness"]';

async function autoScroll(page: Page): Promise<void> {
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      const distance = 200;
      const delay = 80;

      let container: Element | null = null;
      const contentEl = document.querySelector('[role="main"], main, article');
      if (contentEl) {
        let el: Element | null = contentEl;
        while (el && el !== document.body && el !== document.documentElement) {
          const style = window.getComputedStyle(el);
          if ((style.overflowY === 'auto' || style.overflowY === 'scroll') &&
              el.scrollHeight > el.clientHeight) {
            container = el;
            break;
          }
          el = el.parentElement;
        }
      }

      const timer = setInterval(() => {
        if (container) { (container as HTMLElement).scrollTop += distance; }
        else { window.scrollBy(0, distance); }

        const scrollPos = container ? container.scrollTop : window.scrollY;
        const maxScroll = container
          ? container.scrollHeight - container.clientHeight
          : document.body.scrollHeight - window.innerHeight;

        if (scrollPos >= maxScroll - 1) { clearInterval(timer); resolve(); }
      }, delay);
      setTimeout(() => { clearInterval(timer); resolve(); }, 10000);
    });
  });
}

async function runInteractions(page: Page, site: LiveSite): Promise<void> {
  // 1. Dwell on start page so headings accumulate visibility time.
  log('  → section_visible (dwell 2 s)');
  await sleep(2000);

  // 2. Click a TOC link.
  log('  → toc_click');
  try {
    const found = await page.evaluate((sels: string[]) => {
      for (const sel of sels) {
        const toc = document.querySelector(sel);
        if (!toc) continue;
        const link = toc.querySelector('a[href^="#"]');
        if (!link) continue;
        link.setAttribute('data-do11y-test-toc', '1');
        return true;
      }
      return false;
    }, TOC_SELECTORS);
    if (found) {
      await page.click('[data-do11y-test-toc]');
    } else {
      warn('  ⚠ No TOC link found, skipping');
    }
  } catch { /* ignore */ }
  await sleep(500);

  // 3. Scroll to bottom → scroll_depth + section_visible exits.
  log('  → scroll_depth');
  await autoScroll(page);
  await sleep(1000);

  // 4. Click search → search_opened.
  log('  → search_opened');
  try {
    await page.waitForSelector(SEARCH_SEL, { timeout: 3000 });
    await page.click(SEARCH_SEL);
  } catch { warn('  ⚠ No search element found, skipping'); }
  await sleep(500);
  await page.keyboard.press('Escape');
  await sleep(300);

  // 5. Click a copy button → code_copied.
  log('  → code_copied');
  try {
    const copied = await page.evaluate((sel: string) => {
      const el = document.querySelector(sel);
      if (el) { (el as HTMLElement).click(); return true; }
      return false;
    }, COPY_SEL);
    if (!copied) warn('  ⚠ No copy button found, skipping');
  } catch { /* ignore */ }
  await sleep(500);

  // 6. Expand a <details> element → expand_collapse.
  log('  → expand_collapse');
  try {
    const expanded = await page.evaluate(() => {
      const details = document.querySelector('details:not([open])');
      if (details) {
        const summary = details.querySelector('summary');
        if (summary) { (summary as HTMLElement).click(); return true; }
      }
      return false;
    });
    if (!expanded) warn('  ⚠ No <details> element found, skipping');
  } catch { /* ignore */ }
  await sleep(500);

  // 7. Click a feedback button → feedback.
  log('  → feedback');
  try {
    const clicked = await page.evaluate((sel: string) => {
      const container = document.querySelector(sel);
      if (container) {
        const btn = container.querySelector('button[data-value], button');
        if (btn) { (btn as HTMLElement).click(); return true; }
      }
      return false;
    }, FEEDBACK_SEL);
    if (!clicked) warn('  ⚠ No feedback widget found, skipping');
  } catch { /* ignore */ }
  await sleep(500);

  // 8. Click an internal link → link_click + page_view (second page).
  //    Falls back to direct goto if no suitable link is found, which still
  //    produces page_view #2 but not link_click.
  log('  → link_click + page_view (second page)');
  const hostname = new URL(site.startUrl).hostname;
  try {
    const foundLink = await page.evaluate((host: string) => {
      const links = Array.from(document.querySelectorAll('a[href]')) as HTMLAnchorElement[];
      const link = links.find(a => {
        if (a.target === '_blank') return false;
        try {
          const u = new URL(a.href);
          return u.hostname === host && u.pathname !== window.location.pathname;
        } catch { return false; }
      });
      if (link) {
        link.setAttribute('data-do11y-test-nav', '1');
        return { href: link.href, text: (link.textContent ?? '').trim().slice(0, 60) };
      }
      return null;
    }, hostname);
    const found = foundLink !== null;

    if (found) {
      log(`  [diag] clicking: ${foundLink!.href} ("${foundLink!.text}")`);
      await Promise.all([
        page.click('[data-do11y-test-nav]'),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
      ]);
    } else {
      warn('  ⚠ No internal link found, navigating directly (no link_click)');
      await page.goto(site.secondUrl, { waitUntil: 'networkidle2', timeout: 15000 });
    }
  } catch {
    await page.goto(site.secondUrl, { waitUntil: 'networkidle2', timeout: 15000 });
  }
  // Give the SPA router time to update the URL and for do11y's MutationObserver
  // to fire and enqueue the second page_view before we flush.
  await sleep(3000);

  // 8b. Explicit flush — ensures the second page_view (enqueued by SPA
  //     navigation detection) is sent before beforeunload fires. Without this,
  //     page_view #2 can be queued after beforeunload starts on SPA frameworks
  //     like Docusaurus and VitePress and never make it to Axiom.
  log('  → flush (pre-close)');
  try {
    await page.evaluate(() => {
      const api = (window as unknown as Record<string, unknown>).AxiomDo11y as { flush?: () => void } | undefined;
      api?.flush?.();
    });
    await sleep(2000);
  } catch { /* page may have already navigated; beforeunload will flush on close */ }

  // 9. Close page → fires beforeunload → page_exit + final flush.
  log('  → page_exit');
  await page.close({ runBeforeUnload: true });
  // Allow the keepalive fetch to complete before querying Axiom.
  await sleep(2000);
}

// ─── Axiom query ──────────────────────────────────────────────────────────────

async function queryAxiom(testRunId: string, startTime: Date): Promise<AxiomEvent[]> {
  const apl = `['${AXIOM_DATASET}'] | where testRunId == '${testRunId}' | order by _time asc`;
  const body = JSON.stringify({
    apl,
    startTime: startTime.toISOString(),
    endTime:   new Date().toISOString(),
  });

  const url = `https://${AXIOM_DOMAIN}/v1/query/_apl?format=tabular`;
  const res = await fetch(url, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${AXIOM_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Axiom query failed (${res.status}): ${text}`);
  }

  const text = await res.text();
  let data: {
    tables?:  Array<{ fields?: Array<{ name: string }>; columns?: unknown[][] }>;
    matches?: Array<{ _source?: AxiomEvent; data?: AxiomEvent }>;
  };
  try { data = JSON.parse(text); }
  catch { throw new Error(`Axiom returned non-JSON: ${text.slice(0, 500)}`); }

  const table = data.tables?.[0];
  if (table?.fields && table?.columns) {
    const fieldNames = table.fields.map(f => f.name);
    const numRows = table.columns[0]?.length ?? 0;
    const rows: AxiomEvent[] = [];
    for (let j = 0; j < numRows; j++) {
      const obj: AxiomEvent = {};
      fieldNames.forEach((name, i) => { obj[name] = table.columns![i]?.[j]; });
      rows.push(obj);
    }
    return rows;
  }

  if (Array.isArray(data.matches)) {
    return data.matches.map(m => m._source ?? m.data ?? m as AxiomEvent);
  }

  return [];
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateEvents(
  events: AxiomEvent[],
): { pass: number; fail: number; lines: string[] } {
  const byType: Record<string, number> = {};
  for (const e of events) {
    if (e.eventType) byType[e.eventType] = (byType[e.eventType] ?? 0) + 1;
  }

  let pass = 0;
  let failCount = 0;
  const lines: string[] = [];

  for (const [type, { min }] of Object.entries(EXPECTED_EVENTS)) {
    const count = byType[type] ?? 0;
    const ok = count >= min;
    if (ok) pass++; else failCount++;
    const icon = ok ? '✅' : (min === 0 ? '⚠️' : '❌');
    lines.push(`  ${icon} ${type.padEnd(18)} ${count} event(s) (expected ≥${min})`);
  }

  return { pass, fail: failCount, lines };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  if (!AXIOM_DOMAIN || !AXIOM_TOKEN || !AXIOM_DATASET) {
    fail('Missing required env vars: AXIOM_DOMAIN, AXIOM_TOKEN, AXIOM_DATASET');
    process.exit(1);
  }

  ensureBuild();

  const testRunId  = `live-e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const startTime  = new Date();
  log(`Test run: ${testRunId}`);
  log(`Dataset:  ${AXIOM_DATASET}`);

  let names = Object.keys(LIVE_SITES);
  if (process.env.FRAMEWORKS) {
    const requested = process.env.FRAMEWORKS.split(',').map(s => s.trim());
    names = names.filter(n => requested.includes(n));
  }
  log(`Frameworks: ${names.join(', ')}\n`);

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const puppeteer = require('puppeteer') as {
    launch: (opts: { headless: boolean; args?: string[] }) => Promise<Browser>;
  };
  const browser = await puppeteer.launch({
    headless: true,
    args: process.env.CI ? ['--no-sandbox', '--disable-setuid-sandbox'] : [],
  });

  const tested: string[] = [];

  for (const name of names) {
    const site = LIVE_SITES[name]!;
    console.log(`\n${'─'.repeat(60)}`);
    log(`${name}`);
    log(`  start:  ${site.startUrl}`);
    log(`  second: ${site.secondUrl}`);
    console.log(`${'─'.repeat(60)}`);

    const page: Page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    await injectDo11y(page, name, testRunId);

    log('  → page_view (start page)');
    try {
      await page.goto(site.startUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    } catch (err) {
      warn(`  Failed to load ${site.startUrl}: ${(err as Error).message}`);
      await page.close();
      continue;
    }

    try {
      await runInteractions(page, site);
      log('  Interactions complete');
      tested.push(name);
    } catch (err) {
      warn(`  Interaction error: ${(err as Error).message}`);
      tested.push(name);
      try { await page.close(); } catch { /* ignore */ }
    }
  }

  await browser.close();

  // Wait for Axiom to ingest all events.
  log('\nWaiting 15 s for Axiom ingest…');
  await sleep(15000);

  // Query and validate.
  console.log(`\n${'='.repeat(60)}`);
  log('QUERYING AXIOM');
  console.log(`${'='.repeat(60)}`);

  let allEvents: AxiomEvent[];
  try {
    allEvents = await queryAxiom(testRunId, startTime);
    log(`Total events received: ${allEvents.length}\n`);
  } catch (err) {
    fail(`Axiom query failed: ${(err as Error).message}`);
    process.exit(1);
  }

  let grandPass = 0;
  let grandFail = 0;

  for (const name of names) {
    console.log(`\n┌─ ${name}`);

    if (!tested.includes(name)) {
      console.log(`│  ⏭  Skipped (failed to load)`);
      continue;
    }

    const fwEvents = allEvents.filter(e => e.testFramework === name);
    console.log(`│  ${fwEvents.length} events ingested`);

    if (fwEvents.length === 0) {
      console.log(`│  ❌ No events found — do11y may not have loaded or flushed`);
      grandFail += Object.values(EXPECTED_EVENTS).filter(e => e.min > 0).length;
      continue;
    }

    const v = validateEvents(fwEvents);
    for (const line of v.lines) console.log(`│  ${line}`);
    grandPass += v.pass;
    grandFail += v.fail;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`TOTAL: ${grandPass} passed, ${grandFail} failed`);
  console.log(`${'='.repeat(60)}`);

  process.exit(grandFail > 0 ? 1 : 0);
})();
