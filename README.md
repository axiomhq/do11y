# Axiom Do11y

Documentation observability for Axiom. A single, dependency-free JavaScript file that tracks how people use your documentation — page views, scroll depth, link clicks, search usage, code-block copies, section reading time, tab switches, TOC usage, feedback, and expand/collapse interactions — and sends the data to [Axiom](https://axiom.co).

## Privacy

Do11y collects anonymous usage data without:

- Cookies (uses `sessionStorage` only — cleared when the browser closes)
- Personal identifiable information (PII)
- Device fingerprinting
- Cross-site tracking

No GDPR consent banner is required.

## Quick start

1. Add the script to every page of your documentation site, before the closing `</body>` tag:

```html
<script src="/path/to/do11y.js"></script>
```

2. Configure your Axiom credentials using one of the methods below. Do not edit `do11y.js` directly -- this allows you to update to new versions without losing your configuration.

**Option A: Meta tags** (simplest, covers the essentials)

```html
<meta name="axiom-do11y-domain" content="us-east-1.aws.edge.axiom.co">
<meta name="axiom-do11y-token" content="xaat-your-ingest-token">
<meta name="axiom-do11y-dataset" content="do11y">
<meta name="axiom-do11y-framework" content="mintlify">
```

**Option B: External config file** (full control over all options)

Create a separate config file and load it before `do11y.js`:

```html
<script src="/path/to/do11y-config.js"></script>
<script src="/path/to/do11y.js"></script>
```

In `do11y-config.js`, set any config options you want to override:

```javascript
window.Do11yConfig = {
  'axiom-domain': 'us-east-1.aws.edge.axiom.co',
  'api-token': 'xaat-your-ingest-token',
  'dataset-name': 'do11y',
  framework: 'mintlify',
  allowedDomains: ['docs.example.com'],
};
```

For frameworks like Mintlify that auto-include all `.js` files in the content directory, place both files in the same directory. Name the config file so it loads before `do11y.js` alphabetically (e.g. `do11y-config.js`).

Meta tags take precedence over `window.Do11yConfig`, which takes precedence over the defaults in `do11y.js`.

3. Create an API token in Axiom with **ingest-only** permissions scoped to a single dataset.

## Configuration

All options can be set via `window.Do11yConfig`, meta tags, or the `config` object at the top of `do11y.js`. Using `window.Do11yConfig` or meta tags is recommended so you can update `do11y.js` without losing your settings.

### Axiom connection

| Option | Default | Description |
|---|---|---|
| `axiom-domain` | `'AXIOM_DOMAIN'` | Axiom ingest endpoint. Use an [edge deployment](https://axiom.co/docs/reference/edge-deployments) domain for lower latency. |
| `dataset-name` | `'DATASET_NAME'` | Target Axiom dataset. |
| `api-token` | `'API_TOKEN'` | Ingest-only API token. |

### Behavior

| Option | Default | Description |
|---|---|---|
| `debug` | `false` | Log events to the browser console. |
| `flushInterval` | `5000` | Milliseconds between batch flushes. |
| `maxBatchSize` | `10` | Events queued before forcing a flush. |
| `trackOutboundLinks` | `true` | Track clicks on external links. |
| `trackInternalLinks` | `true` | Track clicks on internal links. |
| `trackScrollDepth` | `true` | Track scroll depth thresholds. |
| `scrollThresholds` | `[25, 50, 75, 90]` | Scroll percentages to record. |
| `trackSectionVisibility` | `true` | Track which headings users actually read (via IntersectionObserver). |
| `sectionVisibleThreshold` | `3` | Minimum seconds a section must be visible before recording. |
| `trackTabSwitches` | `true` | Track code language/framework tab switches. |
| `trackTocClicks` | `true` | Track on-page table of contents clicks. |
| `trackExpandCollapse` | `true` | Track expand/collapse interactions (details, accordions). |
| `trackFeedback` | `true` | Track "Was this helpful?" feedback widget clicks. |
| `allowedDomains` | `['ALLOWED_DOMAINS']` | Restrict which domains may send data. Set to `null` to allow any. |
| `respectDNT` | `true` | Honor the browser's Do Not Track setting. |
| `maxRetries` | `2` | Retry count for failed requests. |
| `retryDelay` | `1000` | Base delay between retries (doubles each attempt). |
| `rateLimitMs` | `100` | Minimum gap between events of the same type. |

### Documentation framework

Set `framework` to auto-configure CSS selectors for your docs platform:

| Value | Framework |
|---|---|
| `'mintlify'` | [Mintlify](https://mintlify.com) (default) |
| `'docusaurus'` | [Docusaurus](https://docusaurus.io) |
| `'nextra'` | [Nextra](https://nextra.site) |
| `'gitbook'` | [GitBook](https://gitbook.com) |
| `'mkdocs-material'` | [MkDocs Material](https://squidfunk.github.io/mkdocs-material/) |
| `'vitepress'` | [VitePress](https://vitepress.dev) |
| `'custom'` | Provide your own selectors (see below) |

When `framework` is set to a supported value, the script automatically uses the correct CSS selectors for search bars, copy buttons, code blocks, navigation, footers, and content areas. You can also set the framework via a meta tag:

```html
<meta name="axiom-do11y-framework" content="docusaurus">
```

### Custom selectors

Set `framework: 'custom'` and provide any combination of these selectors. Any selector left `null` falls back to the Mintlify default.

| Selector | What it targets |
|---|---|
| `searchSelector` | Search trigger elements (input, button). |
| `copyButtonSelector` | "Copy code" buttons inside code blocks. |
| `codeBlockSelector` | Code block containers (`<pre>`, wrappers). |
| `navigationSelector` | Navigation and sidebar regions. |
| `footerSelector` | Page footer. |
| `contentSelector` | Main content area. |
| `tabContainerSelector` | Tab groups for code language/framework switching. |
| `tocSelector` | On-page table of contents container. |
| `feedbackSelector` | "Was this helpful?" feedback widget container. |

## Events collected

| Event | Description | Key fields |
|---|---|---|
| `page_view` | Fires on every page load or SPA navigation. | `referrerDomain`, `referrerCategory`, `aiPlatform`, `isFirstPage`, `previousPath` |
| `link_click` | Internal, external, anchor, or email link click. | `linkType`, `targetUrl`, `linkText`, `linkContext`, `linkSection`, `linkIndex` |
| `scroll_depth` | User scrolls past a configured threshold. | `threshold`, `scrollPercent` |
| `page_exit` | Fires on `beforeunload`. | `totalTimeSeconds`, `activeTimeSeconds`, `engagementRatio`, `maxScrollDepth` |
| `search_opened` | User opens the search dialog (click or Cmd/Ctrl+K). | `trigger` |
| `code_copied` | User clicks a code block's copy button. | `language`, `codeSection`, `codeBlockIndex` |
| `section_visible` | A heading was visible in the viewport long enough to be read. | `heading`, `headingLevel`, `visibleSeconds` |
| `tab_switch` | User switches a code language/framework tab. | `tabLabel`, `tabGroup`, `isDefault` |
| `toc_click` | User clicks an entry in the on-page table of contents. | `heading`, `headingLevel`, `tocPosition` |
| `feedback` | User clicks a "Was this helpful?" button. | `rating` |
| `expand_collapse` | User toggles a `<details>` element or accordion. | `summary`, `action`, `section` |

Every event also includes: `sessionId`, `sessionPageCount`, `path`, `hash`, `title`, `viewportCategory`, `browserFamily`, `deviceType`, `language`, `timezoneOffset`.

## Example queries

See [QUERIES.md](QUERIES.md) for APL queries to analyze your documentation, including:

- AI traffic detection and trends
- Traffic sources and entry points
- Page engagement and scroll completion
- Where users get stuck (exit pages, low engagement)
- Navigation patterns and user journeys
- Link and CTA performance
- Code block engagement

## JavaScript API

Do11y exposes `window.AxiomDo11y` for debugging and integration:

```javascript
AxiomDo11y.getConfig()    // Current config (token redacted)
AxiomDo11y.isEnabled()    // Whether tracking is active
AxiomDo11y.debug(true)    // Toggle console logging
AxiomDo11y.flush()        // Force-send queued events
AxiomDo11y.getQueueSize() // Number of queued events
AxiomDo11y.cleanup()      // Disconnect observers and flush (for SPA unmount)
AxiomDo11y.version        // Script version
```

## Tests

The `tests` directory contains multiple layers of testing.

### Selector tests against live sites (`tests/test-live-sites.js`)

Runs headless Chromium via Puppeteer against real documentation sites to validate that selectors match elements in production.

```bash
cd tests
npm i
npx puppeteer browsers install chrome
npm run test-live-sites
```

Sites tested:

| Framework | URL |
|---|---|
| Mintlify | https://axiom.co/docs/query-data/explore |
| Docusaurus | https://docusaurus.io/docs/configuration |
| Nextra | https://nextra.site/docs/getting-started |
| GitBook | https://docs.gitbook.com/content-creation/blocks/code-block |
| MkDocs Material | https://squidfunk.github.io/mkdocs-material/getting-started/ |
| VitePress | https://vitepress.dev/guide/getting-started |

### Query validation (`tests/test-queries.js`)

Validates that all APL queries in [QUERIES.md](QUERIES.md) are syntactically correct by executing them against the Axiom API.

```bash
cd tests
npm run test-queries
```

### Integration tests (`tests/test-integrations.js`)

End-to-end tests that install each supported framework, inject `do11y.js`, start a local dev server, drive user interactions via Puppeteer, and then query the Axiom API to verify that events arrived correctly.

```bash
cd tests
npm i
npx puppeteer browsers install chrome
```

Copy `tests/.env.example` to `tests/.env` and add your credentials:

```
AXIOM_DOMAIN=us-east-1.aws.edge.axiom.co
AXIOM_TOKEN=xaat-your-ingest-token
AXIOM_DATASET=do11y
```

The token needs both **ingest** and **query** permissions on the target dataset.

Run the full suite:

```bash
npm run test-integrations
```

Run a subset of frameworks:

```bash
FRAMEWORKS=mintlify,vitepress npm run test-integrations
```

Skip dependency installation on repeat runs:

```bash
SKIP_INSTALL=1 npm run test-integrations
```

**Frameworks tested:**

| Name | Type | Port | Notes |
|---|---|---|---|
| `mintlify` | npm (Mintlify CLI) | 4005 | Full framework install |
| `gitbook` | npm (HonKit) + static serve | 4006 | Built with HonKit (GitBook OSS fork), served as static HTML |
| `docusaurus` | npm (Docusaurus 3) | 4001 | Full framework install |
| `nextra` | npm (Next.js + Nextra 3) | 4002 | Full framework install |
| `vitepress` | npm (VitePress 1.x) | 4003 | Full framework install |
| `mkdocs-material` | pip (MkDocs Material) | 4004 | Requires Python; skipped if unavailable |

**Events validated per framework:**

| Event | Minimum expected |
|---|---|
| `page_view` | 2 (start page + guide page) |
| `scroll_depth` | 1 |
| `link_click` | 1 |
| `page_exit` | 1 |
| `search_opened` | 0 (best-effort) |
| `code_copied` | 0 (best-effort) |

## AI traffic detection

Do11y classifies referrer domains to detect traffic from AI platforms such as ChatGPT, Perplexity, Claude, Gemini, Copilot, DeepSeek, and others. Each `page_view` event includes:

| Field | Values | Description |
|---|---|---|
| `referrerCategory` | `ai`, `search-engine`, `social`, `community`, `code-host`, `direct`, `internal`, `other`, `unknown` | High-level traffic source category. |
| `aiPlatform` | `ChatGPT`, `Perplexity`, `Claude`, `Gemini`, `Copilot`, `DeepSeek`, `Meta AI`, `Grok`, `Mistral`, `You.com`, `Phind`, or `null` | Specific AI platform when `referrerCategory` is `ai`. |

This detection is referrer-based: it checks whether the `document.referrer` hostname matches a known AI platform. No fingerprinting, user-agent parsing, or additional data collection is involved.

**Limitation:** Most AI platforms (especially ChatGPT mobile and API-sourced visits) do not pass referrer headers. These visits appear as `direct` traffic. Referrer-based detection typically captures 20-40% of AI traffic. Detecting the remaining "dark AI" traffic would require fingerprinting techniques that conflict with Do11y's privacy-first design.

See [QUERIES.md](QUERIES.md) for APL queries to analyze AI traffic, including per-platform breakdowns, trends, and engagement comparisons.

## Known limitations

### Copy-button detection on GitBook

The `copyButtonSelector` does not match copy buttons on **GitBook** sites. GitBook renders copy buttons with generic Tailwind CSS utility classes and no semantic attributes (`class`, `aria-label`, `title`, and `data-testid` all lack any "copy" identifier). There is no CSS selector that can reliably target these buttons without also matching unrelated elements.

**Workaround:** If you use GitBook and need copy-button tracking, set `framework: 'custom'` and provide a selector specific to your site's DOM, or listen for clipboard events directly.

### Custom themes

The selectors work on sites using the standard themes of each supported framework. Sites with heavily customized themes may render page elements differently. If you use a custom theme, you may need to set the selectors manually.

### Framework selector drift

CSS selectors are based on each framework's current DOM output and may break when frameworks release major updates that change class names or HTML structure. The test suites (`test-live-sites.js` and `test-queries.js`) exist specifically to catch this. Run them periodically to verify selectors still match.

## Automatic sync to your docs repo

The included GitHub Action (`.github/workflows/sync-to-docs.yml`) can automatically open a PR in your docs repo whenever you publish a new do11y release. This keeps the copy of `do11y.js` in your docs site in sync without manual copying.

### Setup

Configure the workflow in your fork or copy of this repo under **Settings > Secrets and variables > Actions**:

**Variables:**

| Variable | Example | Description |
|---|---|---|
| `DOCS_REPO` | `axiomhq/docs` | Target docs repo in `owner/name` format. |
| `DOCS_DEST_PATH` | `styles/do11y.js` | Path where `do11y.js` lives in the target repo. |

**Secrets:**

| Secret | Description |
|---|---|
| `DOCS_REPO_TOKEN` | A GitHub Personal Access Token with `contents: write` and `pull_requests: write` permissions on the target docs repo. |

To create the token: go to **GitHub > Settings > Developer settings > Fine-grained tokens**, create a token scoped to your docs repo with the permissions above, and store it as `DOCS_REPO_TOKEN` in this repo's action secrets.

### Creating a release

Tag and release to trigger the sync:

```bash
git tag v1.1.0
git push origin v1.1.0
gh release create v1.1.0
```

The workflow checks out both repos, copies `do11y.js` to the configured destination, and opens a PR in your docs repo titled "Update do11y.js to v1.1.0". If the file hasn't changed, the workflow skips the PR.

The workflow only replaces `do11y.js` itself. Your site-specific configuration is safe as long as you use `window.Do11yConfig` (in a separate file like `do11y-config.js`) or meta tags instead of editing `do11y.js` directly. See [Quick start](#quick-start) for setup.

## License

[MIT](LICENSE)
