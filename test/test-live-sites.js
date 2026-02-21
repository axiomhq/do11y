const puppeteer = require('puppeteer');

const FRAMEWORK_PRESETS = {
  mintlify: {
    searchSelector: '#search-bar-entry, #search-bar-entry-mobile, [class*="search"]',
    copyButtonSelector: '[class*="copy"], button[aria-label*="copy" i]',
    codeBlockSelector: 'pre, [class*="code"]',
    navigationSelector: 'nav, [role="navigation"], #navbar, #sidebar, [class*="nav"], [class*="sidebar"]',
    footerSelector: 'footer, [role="contentinfo"], [class*="footer"]',
    contentSelector: 'main, article, [role="main"], [class*="content"]',
  },
    docusaurus: {
      searchSelector: '.DocSearch, .DocSearch-Button',
      copyButtonSelector: 'button.clean-btn[aria-label*="copy" i], button[class*="copyButton"]',
      codeBlockSelector: 'pre, [class*="code"]',
      navigationSelector: 'nav, [role="navigation"], .navbar, .sidebar, [class*="nav"], [class*="sidebar"]',
      footerSelector: 'footer, [role="contentinfo"], [class*="footer"]',
      contentSelector: 'main, article, [role="main"], [class*="content"]',
    },
    nextra: {
      searchSelector: '.nextra-search input, input[placeholder*="search" i], button[aria-label*="search" i]',
      copyButtonSelector: 'button[class*="copy"], button[aria-label*="copy" i], button[title*="copy" i]',
      codeBlockSelector: 'pre, [class*="code"]',
      navigationSelector: 'nav, [role="navigation"], [class*="nav"], [class*="sidebar"]',
      footerSelector: 'footer, [role="contentinfo"], [class*="footer"]',
      contentSelector: 'main, article, [role="main"], [class*="content"]',
    },
    gitbook: {
      searchSelector: '[data-testid*="search"], button[aria-label*="search" i]',
      copyButtonSelector: '[class*="copy"], button[aria-label*="copy" i]',
      codeBlockSelector: 'pre, code, [class*="code"]',
      navigationSelector: 'nav, [role="navigation"], [class*="nav"], [class*="sidebar"]',
      footerSelector: 'footer, [role="contentinfo"], [class*="footer"]',
      contentSelector: 'main, article, [role="main"], [class*="content"]',
    },
    'mkdocs-material': {
      searchSelector: '.md-search__input',
      copyButtonSelector: '.md-clipboard, .md-code__button[title="Copy to clipboard"]',
      codeBlockSelector: 'pre, code, [class*="code"]',
      navigationSelector: 'nav, [role="navigation"], .md-nav, .md-sidebar',
      footerSelector: 'footer, [role="contentinfo"], .md-footer',
      contentSelector: 'main, article, [role="main"], .md-content',
    },
    vitepress: {
      searchSelector: '.VPNavBarSearch button, .VPNavBarSearchButton, #local-search',
      copyButtonSelector: '.vp-code-copy, button.copy[title*="Copy"]',
      codeBlockSelector: 'pre, [class*="code"]',
      navigationSelector: 'nav, [role="navigation"], .VPNav, .VPSidebar, [class*="nav"], [class*="sidebar"]',
      footerSelector: 'footer, [role="contentinfo"], .VPFooter, [class*="footer"]',
      contentSelector: 'main, article, [role="main"], .VPContent, [class*="content"]',
    },
};

// Real documentation sites for each framework.
// We pick a page with code blocks so copyButton and codeBlock selectors have a chance.
const TEST_SITES = {
  mintlify:          'https://axiom.co/docs/query-data/explore',
  docusaurus:        'https://docusaurus.io/docs/configuration',
  nextra:            'https://nextra.site/docs/getting-started',
  gitbook:           'https://docs.gitbook.com/content-creation/blocks/code-block',
  'mkdocs-material': 'https://squidfunk.github.io/mkdocs-material/getting-started/',
  vitepress:         'https://vitepress.dev/guide/getting-started',
};

const SELECTOR_KEYS = [
  'searchSelector',
  'copyButtonSelector',
  'codeBlockSelector',
  'navigationSelector',
  'footerSelector',
  'contentSelector',
];

async function testFramework(browser, name, url, selectors) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    // Extra wait for JS-rendered content
    await new Promise(r => setTimeout(r, 2000));
  } catch (err) {
    console.log(`\n❌ ${name} — failed to load ${url}: ${err.message}`);
    await page.close();
    return { name, url, error: err.message, results: {} };
  }

  const results = await page.evaluate((sels, keys) => {
    const out = {};
    for (const key of keys) {
      const sel = sels[key];
      try {
        const els = document.querySelectorAll(sel);
        const first = els[0];
        out[key] = {
          matched: els.length,
          firstTag: first ? first.tagName.toLowerCase() : null,
          firstClasses: first ? first.className.toString().slice(0, 120) : null,
          firstId: first?.id || null,
        };
      } catch (e) {
        out[key] = { matched: 0, error: e.message };
      }
    }
    return out;
  }, selectors, SELECTOR_KEYS);

  await page.close();
  return { name, url, results };
}

(async () => {
  console.log('Launching browser…\n');
  const browser = await puppeteer.launch({ headless: true });

  const allResults = [];

  for (const name of Object.keys(FRAMEWORK_PRESETS)) {
    const url = TEST_SITES[name];
    const selectors = FRAMEWORK_PRESETS[name];
    process.stdout.write(`Testing ${name} (${url})… `);
    const result = await testFramework(browser, name, url, selectors);
    allResults.push(result);

    if (result.error) {
      console.log('LOAD ERROR');
      continue;
    }

    const pass = SELECTOR_KEYS.filter(k => result.results[k]?.matched > 0).length;
    const total = SELECTOR_KEYS.length;
    console.log(`${pass}/${total} selectors matched`);
  }

  await browser.close();

  // Print detailed report
  console.log('\n' + '='.repeat(72));
  console.log('DETAILED RESULTS');
  console.log('='.repeat(72));

  let grandPass = 0;
  let grandFail = 0;

  for (const { name, url, error, results } of allResults) {
    console.log(`\n┌─ ${name}`);
    console.log(`│  ${url}`);
    if (error) {
      console.log(`│  ❌ Load error: ${error}`);
      grandFail += SELECTOR_KEYS.length;
      continue;
    }
    for (const key of SELECTOR_KEYS) {
      const r = results[key];
      const ok = r.matched > 0;
      const icon = ok ? '✅' : '❌';
      if (ok) grandPass++; else grandFail++;
      let detail = `${r.matched} match(es)`;
      if (r.firstTag) detail += ` — first: <${r.firstTag}>`;
      if (r.firstId) detail += `#${r.firstId}`;
      if (r.firstClasses) detail += `.${r.firstClasses.split(' ')[0]}`;
      console.log(`│  ${icon} ${key.padEnd(22)} ${detail}`);
    }
  }

  console.log('\n' + '='.repeat(72));
  console.log(`TOTAL: ${grandPass} passed, ${grandFail} failed out of ${grandPass + grandFail}`);
  console.log('='.repeat(72));

  process.exit(grandFail > 0 ? 1 : 0);
})();
