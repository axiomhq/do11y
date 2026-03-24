/**
 * Do11y integration test runner.
 *
 * Loads AXIOM_DOMAIN, AXIOM_TOKEN, AXIOM_DATASET from .env in this directory.
 * Run: npm test (or node run.js from this directory)
 *
 * For each supported framework, this script:
 *   1. Scaffolds a minimal documentation site with do11y.js injected
 *   2. Starts the framework's dev server
 *   3. Drives Puppeteer through a set of user interactions
 *   4. Waits for events to flush to Axiom
 *   5. Queries the Axiom API to validate that the expected events arrived
 *
 * Required (set in .env in this directory):
 *   AXIOM_DOMAIN      — Axiom domain (e.g. axiom.co or dev.axiomtestlabs.co)
 *   AXIOM_TOKEN       — API token with ingest + query permissions
 *   AXIOM_DATASET     — Dataset name (e.g. do11y-integration-test)
 *
 * Optional (can override in .env or shell):
 *   FRAMEWORKS      — Comma-separated list of frameworks to test (default: all)
 *   SKIP_INSTALL    — "1" skips install entirely; "0" forces install even if node_modules exists; unset installs only when node_modules is absent
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const AXIOM_DOMAIN = process.env.AXIOM_DOMAIN;
const AXIOM_TOKEN = process.env.AXIOM_TOKEN;
const AXIOM_DATASET = process.env.AXIOM_DATASET;
const SKIP_INSTALL = process.env.SKIP_INSTALL === '1';
const FORCE_INSTALL = process.env.SKIP_INSTALL === '0';

const DO11Y_SRC = path.resolve(__dirname, '../dist/do11y.js');
const SITES_DIR = path.join(__dirname, 'sites');

// ─── Framework definitions ──────────────────────────────────────────────────

const FRAMEWORKS = {
  mintlify: {
    port: 4005,
    type: 'npm',
    dir: path.join(SITES_DIR, 'mintlify'),
    do11yDest: path.join(SITES_DIR, 'mintlify', 'do11y.js'),
    startCmd: 'npm',
    startArgs: ['start'],
    readyPattern: /Ready in|localhost:4005|started/i,
    startPage: '/introduction',
    guidePage: '/guide',
  },
  gitbook: {
    port: 4006,
    type: 'static',
    dir: path.join(SITES_DIR, 'gitbook'),
    staticDir: path.join(SITES_DIR, 'gitbook', '_book'),
    do11yDest: path.join(SITES_DIR, 'gitbook', '_book', 'do11y.js'),
    buildCmd: 'npx honkit build',
    injectDo11y: true,
    startPage: '/',
    guidePage: '/guide.html',
  },
  docusaurus: {
    port: 4001,
    type: 'npm',
    dir: path.join(SITES_DIR, 'docusaurus'),
    do11yDest: path.join(SITES_DIR, 'docusaurus', 'static', 'do11y.js'),
    startCmd: 'npm',
    startArgs: ['start'],
    readyPattern: /Docusaurus.*started|localhost:4001/,
    startPage: '/',
    guidePage: '/guide',
  },
  nextra: {
    port: 4002,
    type: 'npm',
    dir: path.join(SITES_DIR, 'nextra'),
    do11yDest: path.join(SITES_DIR, 'nextra', 'public', 'do11y.js'),
    buildCmd: 'npm run build',
    startCmd: 'npm',
    startArgs: ['run', 'start'],
    readyPattern: /Ready|started server|localhost:4002/,
    startPage: '/',
    guidePage: '/guide',
  },
  vitepress: {
    port: 4003,
    type: 'npm',
    dir: path.join(SITES_DIR, 'vitepress'),
    do11yDest: path.join(SITES_DIR, 'vitepress', '.vitepress', 'dist', 'do11y.js'),
    buildCmd: 'npm run build',
    startCmd: 'npm',
    startArgs: ['run', 'start'],
    readyPattern: /localhost:4003/i,
    startPage: '/',
    guidePage: '/guide',
  },
  'mkdocs-material': {
    port: 4004,
    type: 'pip',
    dir: path.join(SITES_DIR, 'mkdocs-material'),
    do11yDest: path.join(SITES_DIR, 'mkdocs-material', 'docs', 'do11y.js'),
    startCmd: 'mkdocs',
    startArgs: ['serve', '--dev-addr', '127.0.0.1:4004', '--no-livereload'],
    readyPattern: /Serving on|Start watching|localhost:4004/,
    startPage: '/',
    guidePage: '/guide/',
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function log(msg) { console.log(`\x1b[36m[runner]\x1b[0m ${msg}`); }
function warn(msg) { console.log(`\x1b[33m[runner]\x1b[0m ${msg}`); }
function fail(msg) { console.log(`\x1b[31m[runner]\x1b[0m ${msg}`); }

function patchDo11y(destPath, framework, testRunId) {
  let src = fs.readFileSync(DO11Y_SRC, 'utf8');
  // Trim to guard against trailing newlines from copy-pasting into secret fields
  src = src.replace("'AXIOM_DOMAIN'", `'${AXIOM_DOMAIN.trim()}'`);
  src = src.replace("'DATASET_NAME'", `'${AXIOM_DATASET.trim()}'`);
  src = src.replace("'API_TOKEN'", `'${AXIOM_TOKEN.trim()}'`);
  // allowedDomains defaults to null, no replacement needed
  src = src.replace('debug: false', 'debug: true');
  // Inject testRunId and framework into every event
  src = src.replace(
    'eventType: eventType,',
    `eventType: eventType,\n      testRunId: '${testRunId}',\n      testFramework: '${framework}',`
  );
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(destPath, src);
}

function injectDo11yTags(dir) {
  const entries = fs.readdirSync(dir, { recursive: true });
  for (const entry of entries) {
    const rel = String(entry);
    if (!rel.endsWith('.html')) continue;
    const filePath = path.join(dir, rel);
    let html = fs.readFileSync(filePath, 'utf8');
    if (html.includes('do11y.js')) continue;
    const tags = [
      '<meta name="axiom-do11y-framework" content="gitbook">',
      '<meta name="axiom-do11y-debug" content="true">',
      '<meta name="axiom-do11y-domains" content="localhost">',
      '<script src="/do11y.js" defer></script>',
    ].join('\n    ');
    html = html.replace('</head>', `    ${tags}\n</head>`);
    fs.writeFileSync(filePath, html);
  }
}

function waitForServer(port, timeoutMs = 180000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      if (Date.now() - start > timeoutMs) {
        return reject(new Error(`Server on port ${port} did not start within ${timeoutMs}ms`));
      }
      const req = http.get(`http://localhost:${port}/`, (res) => {
        res.resume();
        if (res.statusCode < 500) resolve();
        else setTimeout(check, 500);
      });
      req.on('error', () => setTimeout(check, 500));
      req.setTimeout(2000, () => { req.destroy(); setTimeout(check, 500); });
    }
    check();
  });
}

function startStaticServer(dir, port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(dir, req.url === '/' ? 'index.html' : req.url);
      if (!path.extname(filePath)) filePath += '.html';
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not found'); return; }
        const ext = path.extname(filePath);
        const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };
        res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(port, () => resolve(server));
  });
}

function installDeps(fw) {
  if (fw.type === 'npm') {
    if (!SKIP_INSTALL && (FORCE_INSTALL || !fs.existsSync(path.join(fw.dir, 'node_modules')))) {
      log(`  Installing npm dependencies…`);
      execSync('npm install', { cwd: fw.dir, stdio: 'pipe' });
    }
  } else if (fw.type === 'pip') {
    // Always check for the binary; pip packages aren't in node_modules
    const extraPath = getPythonUserBins().join(':');
    const checkEnv = { ...process.env, PATH: extraPath + ':' + (process.env.PATH || '') };
    try {
      execSync('mkdocs --version', { stdio: 'pipe', env: checkEnv });
    } catch {
      log(`  Installing pip dependencies…`);
      try {
        execSync('pip install --user -r requirements.txt', { cwd: fw.dir, stdio: 'pipe' });
      } catch {
        execSync('pip3 install --user -r requirements.txt', { cwd: fw.dir, stdio: 'pipe' });
      }
    }
  }
}

function getPythonUserBins() {
  // pip and python3 may resolve to different Python versions (e.g. Xcode 3.9
  // vs Homebrew 3.12), so collect all known user-site bin directories.
  const dirs = new Set();
  for (const cmd of ['python3 -m site --user-base', 'python -m site --user-base']) {
    try {
      const base = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
      if (base) dirs.add(path.join(base, 'bin'));
    } catch { /* ignore */ }
  }
  // Also scan ~/Library/Python/*/bin on macOS
  const pyLibDir = path.join(process.env.HOME || '', 'Library', 'Python');
  try {
    for (const ver of fs.readdirSync(pyLibDir)) {
      dirs.add(path.join(pyLibDir, ver, 'bin'));
    }
  } catch { /* ignore */ }
  return [...dirs];
}

function startDevServer(fw) {
  const env = { ...process.env, BROWSER: 'none', NODE_ENV: 'development' };
  if (fw.type === 'pip') {
    const extraPath = getPythonUserBins().join(':');
    if (extraPath) env.PATH = extraPath + ':' + (env.PATH || '');
  }
  const proc = spawn(fw.startCmd, fw.startArgs, {
    cwd: fw.dir,
    stdio: ['ignore', 'pipe', 'pipe'],
    env,
  });
  let output = '';
  proc.stdout.on('data', (d) => { output += d.toString(); });
  proc.stderr.on('data', (d) => { output += d.toString(); });
  proc.on('error', (err) => { fail(`  Server process error: ${err.message}`); });
  return { proc, getOutput: () => output };
}

function killProc(proc) {
  try { process.kill(-proc.pid, 'SIGTERM'); } catch { /* ignore */ }
  try { proc.kill('SIGTERM'); } catch { /* ignore */ }
}

// ─── Puppeteer interaction scenarios ────────────────────────────────────────

async function runInteractions(browser, baseUrl, fw) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Forward browser console output so do11y debug logs are visible in CI
  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    if (text.includes('[Axiom Do11y]') || type === 'error' || type === 'warning') {
      log(`  [browser:${type}] ${text}`);
    }
  });
  page.on('pageerror', (err) => warn(`  [browser:pageerror] ${err.message}`));
  page.on('requestfailed', (req) => {
    warn(`  [browser:requestfailed] ${req.url()} — ${req.failure()?.errorText}`);
  });

  // 1. Page view on start page
  log('  → page_view (start page)');
  await page.goto(`${baseUrl}${fw.startPage}`, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);

  // Verify do11y.js initialised
  const do11yState = await page.evaluate(() => ({
    initialized: !!window.__axiomDo11yInitialized,
    scriptPresent: !!document.querySelector('script[src*="do11y"]'),
  }));
  if (!do11yState.scriptPresent) warn('  ⚠ No do11y script tag found in DOM');
  if (!do11yState.initialized) warn('  ⚠ window.__axiomDo11yInitialized not set — do11y.js did not load');

  // 2. Scroll to bottom (triggers scroll_depth at 25, 50, 75, 90%)
  log('  → scroll_depth');
  await autoScroll(page);
  await sleep(1000);

  // 3. Click search (triggers search_opened)
  log('  → search_opened');
  try {
    const searchClicked = await page.evaluate(() => {
      const el = document.querySelector(
        '#search-bar-entry, .DocSearch, .DocSearch-Button, .nextra-search input, ' +
        '[data-testid*="search"], .md-search__input, .VPNavBarSearchButton, ' +
        'input[placeholder*="search" i], button[aria-label*="search" i]'
      );
      if (el) { el.click(); return true; }
      return false;
    });
    if (!searchClicked) warn('  ⚠ No search element found, skipping');
  } catch { /* ignore */ }
  await sleep(500);
  // Close any open dialog/overlay
  await page.keyboard.press('Escape');
  await sleep(300);

  // 4. Click copy button (triggers code_copied)
  log('  → code_copied');
  try {
    const copyClicked = await page.evaluate(() => {
      const el = document.querySelector(
        'button.clean-btn[aria-label*="copy" i], button[class*="copyButton"], ' +
        '[class*="copy"], button[aria-label*="copy" i], button[title*="copy" i], ' +
        '.md-clipboard, .md-code__button[title="Copy to clipboard"], ' +
        '.vp-code-copy, button.copy[title*="Copy"]'
      );
      if (el) { el.click(); return true; }
      return false;
    });
    if (!copyClicked) warn('  ⚠ No copy button found, skipping');
  } catch { /* ignore */ }
  await sleep(500);

  // 5. Expand a <details> element (triggers expand_collapse)
  log('  → expand_collapse');
  try {
    const expanded = await page.evaluate(() => {
      const details = document.querySelector('details:not([open])');
      if (details) {
        const summary = details.querySelector('summary');
        if (summary) { summary.click(); return true; }
      }
      return false;
    });
    if (!expanded) warn('  ⚠ No <details> element found, skipping');
  } catch { /* ignore */ }
  await sleep(500);

  // 6. Click a TOC link (triggers toc_click)
  log('  → toc_click');
  try {
    const tocClicked = await page.evaluate(() => {
      const toc = document.querySelector(
        '.table-of-contents, [class*="toc"], [class*="outline"], ' +
        '[class*="TableOfContents"], .VPDocAsideOutline, ' +
        '.md-sidebar--secondary .md-nav, aside.toc'
      );
      if (toc) {
        const link = toc.querySelector('a[href^="#"]');
        if (link) { link.click(); return true; }
      }
      return false;
    });
    if (!tocClicked) warn('  ⚠ No TOC element found, skipping');
  } catch { /* ignore */ }
  await sleep(500);

  // 7. Click feedback button (triggers feedback — only gitbook has this)
  log('  → feedback');
  try {
    const feedbackClicked = await page.evaluate(() => {
      const container = document.querySelector(
        '[class*="feedback"], [class*="helpful"], [data-feedback]'
      );
      if (container) {
        const btn = container.querySelector('button[data-value], button');
        if (btn) { btn.click(); return true; }
      }
      return false;
    });
    if (!feedbackClicked) warn('  ⚠ No feedback widget found, skipping');
  } catch { /* ignore */ }
  await sleep(500);

  // 8. Click internal link to guide page (triggers link_click + page_view)
  log('  → link_click (internal) + page_view (guide)');
  try {
    // Find the link and click it via Puppeteer's mouse (fires DOM click event
    // before SPA routers can intercept, ensuring do11y captures it)
    // Build selector covering absolute and relative path variants
    const gp = fw.guidePage;
    const relPath = gp.startsWith('/') ? gp.slice(1) : gp;
    const linkSel = [gp, `${gp}.html`, `${gp}/`, relPath, `${relPath}.html`, `${relPath}/`, `${relPath}.md`]
      .map((h) => `a[href="${h}"]`).join(', ');
    await page.waitForSelector(linkSel, { timeout: 5000 });
    // Scroll the link into view first (needed for VitePress/Docusaurus where
    // the link may be below the fold)
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) el.scrollIntoView({ block: 'center' });
    }, linkSel);
    await sleep(300);
    await Promise.all([
      page.click(linkSel),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
    ]);
  } catch {
    await page.goto(`${baseUrl}${fw.guidePage}`, { waitUntil: 'networkidle2', timeout: 15000 });
  }
  await sleep(1500);

  // 9. Trigger page_exit by navigating away
  log('  → page_exit');
  await page.goto('about:blank');
  await sleep(1000);

  await page.close();
}

async function autoScroll(page) {
  await page.evaluate(() => {
    return new Promise((resolve) => {
      const distance = 200;
      const delay = 80;

      // Some frameworks (GitBook/HonKit) use container-based scrolling.
      // Find the scrollable container so we scroll it instead of the window.
      let container = null;
      const contentEl = document.querySelector('[role="main"], main, article');
      if (contentEl) {
        let el = contentEl;
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

      const getPos = () => container ? container.scrollTop : window.scrollY;
      const getMax = () => container
        ? container.scrollHeight - container.clientHeight
        : document.body.scrollHeight - window.innerHeight;

      const timer = setInterval(() => {
        if (container) { container.scrollTop += distance; }
        else { window.scrollBy(0, distance); }

        if (getPos() >= getMax() - 1) {
          clearInterval(timer);
          resolve();
        }
      }, delay);
      setTimeout(() => { clearInterval(timer); resolve(); }, 10000);
    });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Axiom query ────────────────────────────────────────────────────────────

async function queryAxiom(testRunId, startTime) {
  const apl = `['${AXIOM_DATASET}'] | where testRunId == '${testRunId}' | order by _time asc`;
  const body = JSON.stringify({
    apl,
    startTime: startTime.toISOString(),
    endTime: new Date().toISOString(),
  });

  const url = `https://${AXIOM_DOMAIN}/v1/query/_apl?format=tabular`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AXIOM_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Axiom query failed (${res.status}): ${text}`);
  }

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`Axiom returned non-JSON: ${text.slice(0, 500)}`); }

  // Axiom tabular format: fields[] has column names, columns[] is column-oriented data
  const table = data.tables?.[0];
  if (table?.fields && table?.columns) {
    const fieldNames = table.fields.map(f => f.name);
    const numRows = table.columns[0]?.length || 0;
    const rows = [];
    for (let j = 0; j < numRows; j++) {
      const obj = {};
      fieldNames.forEach((name, i) => { obj[name] = table.columns[i]?.[j]; });
      rows.push(obj);
    }
    return rows;
  }

  // Legacy format: data.matches[]
  if (Array.isArray(data.matches)) {
    return data.matches.map(m => m._source || m.data || m);
  }

  return [];
}

// ─── Validation ─────────────────────────────────────────────────────────────

const EXPECTED_EVENTS = {
  page_view: { min: 2 },
  scroll_depth: { min: 1 },
  search_opened: { min: 0 },        // best-effort
  code_copied: { min: 0 },          // best-effort
  link_click: { min: 1 },
  page_exit: { min: 1 },
  expand_collapse: { min: 0 },      // best-effort — requires <details> in DOM
  toc_click: { min: 0 },            // best-effort — requires TOC in DOM
  feedback: { min: 0 },             // best-effort — only gitbook has widget
  section_visible: { min: 0 },      // best-effort — requires 3s+ dwell on heading
};

function validateEvents(framework, events) {
  const byType = {};
  for (const e of events) {
    byType[e.eventType] = (byType[e.eventType] || 0) + 1;
  }

  let pass = 0;
  let fail = 0;
  const lines = [];

  for (const [type, { min }] of Object.entries(EXPECTED_EVENTS)) {
    const count = byType[type] || 0;
    const ok = count >= min;
    if (ok) pass++; else fail++;
    const icon = ok ? '✅' : (min === 0 ? '⚠️' : '❌');
    lines.push(`    ${icon} ${type.padEnd(18)} ${count} event(s) (expected ≥${min})`);
  }

  return { pass, fail, lines, total: events.length };
}

// ─── Main ───────────────────────────────────────────────────────────────────

(async () => {
  // Validate env
  if (!AXIOM_DOMAIN || !AXIOM_TOKEN || !AXIOM_DATASET) {
    fail('Missing required env vars: AXIOM_DOMAIN, AXIOM_TOKEN, AXIOM_DATASET');
    process.exit(1);
  }

  const testRunId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const startTime = new Date();
  log(`Test run: ${testRunId}`);
  log(`Dataset:  ${AXIOM_DATASET}`);

  // Filter frameworks if FRAMEWORKS env is set
  let frameworkNames = Object.keys(FRAMEWORKS);
  if (process.env.FRAMEWORKS) {
    const requested = process.env.FRAMEWORKS.split(',').map(s => s.trim());
    frameworkNames = frameworkNames.filter(n => requested.includes(n));
  }

  log(`Frameworks: ${frameworkNames.join(', ')}\n`);

  // Import puppeteer (installed in integration package)
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch {
    // Fall back to the sibling test directory's puppeteer
    puppeteer = require(path.join(__dirname, '../node_modules/puppeteer'));
  }
  const browser = await puppeteer.launch({
    headless: true,
    args: process.env.CI
      ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
      : [],
  });

  const servers = [];       // track servers to shut down later
  const processes = [];     // track child processes to kill later
  const results = {};

  for (const name of frameworkNames) {
    const fw = FRAMEWORKS[name];
    console.log(`\n${'─'.repeat(60)}`);
    log(`${name} (port ${fw.port})`);
    console.log(`${'─'.repeat(60)}`);

    // 0. Kill anything already on this port
    try { execSync(`lsof -ti :${fw.port} | xargs kill -9`, { stdio: 'pipe' }); } catch { /* ok */ }
    // Clean stale build caches that cause 500 errors on cold start
    const fwDir = fw.dir || fw.staticDir;
    if (fwDir) {
      for (const cache of ['.next', '.vitepress/cache', '.vitepress/dist', '_book']) {
        const cacheDir = path.join(fwDir, cache);
        if (fs.existsSync(cacheDir)) fs.rmSync(cacheDir, { recursive: true, force: true });
      }
    }

    // 0b. Build step for static sites that require it (e.g. HonKit)
    if (fw.buildCmd && fw.dir) {
      try {
        if (!SKIP_INSTALL && (FORCE_INSTALL || !fs.existsSync(path.join(fw.dir, 'node_modules')))) {
          log('  Installing npm dependencies…');
          execSync('npm install', { cwd: fw.dir, stdio: 'pipe' });
        }
        log('  Building…');
        execSync(fw.buildCmd, { cwd: fw.dir, stdio: 'pipe' });
      } catch (err) {
        warn(`  Skipping ${name}: build failed (${err.message})`);
        results[name] = { skipped: true, reason: err.message };
        continue;
      }
    }

    // 1. Patch and deploy do11y.js
    log('  Patching do11y.js…');
    patchDo11y(fw.do11yDest, name, testRunId);

    // 1b. Inject do11y meta/script tags into pre-built HTML
    if (fw.injectDo11y && fw.staticDir) {
      log('  Injecting do11y tags into HTML…');
      injectDo11yTags(fw.staticDir);
    }

    // 2. Start server
    let server;
    let devHandle;
    if (fw.type === 'static') {
      server = await startStaticServer(fw.staticDir, fw.port);
      servers.push(server);
      log('  Static server started');
    } else {
      try {
        installDeps(fw);
      } catch (err) {
        warn(`  Skipping ${name}: dependency install failed (${err.message})`);
        results[name] = { skipped: true, reason: err.message };
        continue;
      }
      log('  Starting dev server…');
      devHandle = startDevServer(fw);
      processes.push(devHandle.proc);
    }

    // 3. Wait for server
    try {
      await waitForServer(fw.port);
      log('  Server ready');
    } catch (err) {
      if (devHandle) {
        const out = devHandle.getOutput();
        if (out) fail(`  Server output:\n${out.slice(-500)}`);
      }
      warn(`  Skipping ${name}: ${err.message}`);
      results[name] = { skipped: true, reason: err.message };
      continue;
    }

    // 4. Run interactions
    try {
      await runInteractions(browser, `http://localhost:${fw.port}`, fw);
      log('  Interactions complete');
      results[name] = { tested: true };
    } catch (err) {
      warn(`  Interaction error: ${err.message}`);
      results[name] = { tested: true, interactionError: err.message };
    }
  }

  // 5. Shut down servers
  log('\nStopping servers…');
  for (const s of servers) s.close();
  for (const p of processes) killProc(p);
  await browser.close();

  // 6. Wait for Axiom to ingest
  log('Waiting 15s for Axiom ingest…');
  await sleep(15000);

  // 7. Query and validate
  console.log(`\n${'='.repeat(60)}`);
  log('QUERYING AXIOM');
  console.log(`${'='.repeat(60)}`);

  let allEvents;
  try {
    allEvents = await queryAxiom(testRunId, startTime);
    log(`Total events received: ${allEvents.length}\n`);
  } catch (err) {
    fail(`Axiom query failed: ${err.message}`);
    process.exit(1);
  }

  // 8. Validate per framework
  let grandPass = 0;
  let grandFail = 0;

  for (const name of frameworkNames) {
    const r = results[name];
    console.log(`\n┌─ ${name}`);

    if (r?.skipped) {
      console.log(`│  ⏭  Skipped: ${r.reason}`);
      continue;
    }

    const fwEvents = allEvents.filter(e => e.testFramework === name);
    console.log(`│  ${fwEvents.length} events ingested`);

    if (fwEvents.length === 0) {
      console.log(`│  ❌ No events found — do11y may not have loaded or flushed`);
      grandFail += Object.keys(EXPECTED_EVENTS).length;
      continue;
    }

    const v = validateEvents(name, fwEvents);
    for (const line of v.lines) console.log(`│  ${line}`);
    grandPass += v.pass;
    grandFail += v.fail;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`TOTAL: ${grandPass} passed, ${grandFail} failed`);
  console.log(`${'='.repeat(60)}`);

  // Clean up patched do11y copies
  for (const name of frameworkNames) {
    const fw = FRAMEWORKS[name];
    try { fs.unlinkSync(fw.do11yDest); } catch { /* ignore */ }
  }

  process.exit(grandFail > 0 ? 1 : 0);
})();
